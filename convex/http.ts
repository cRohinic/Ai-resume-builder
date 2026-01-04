import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const http = httpRouter();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, first_name, last_name, image_url, email_addresses } = evt.data;

      const email = email_addresses[0].email_address;

      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.syncUser, {
          email,
          name,
          image: image_url,
          clerkId: id,
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.updateUser, {
          clerkId: id,
          email,
          name,
          image: image_url,
        });
      } catch (error) {
        console.log("Error updating user:", error);
        return new Response("Error updating user", { status: 500 });
      }
    }

    return new Response("Webhooks processed successfully", { status: 200 });
  }),
});

function validateCareerPlan(plan: any) {
  return {
    sections: (plan.sections || []).map((section: any) => ({
      title: section.title || "",
      steps: (section.items || []).map(
        (item: any) => `${item.name || ""}: ${item.details || ""}`
      ),
    })),
  };
}

function validateJobPlan(plan: any) {
  return {
    dailyTasks: (plan.dailyTasks || []).map((dayTask: any, index: number) => ({
      day: dayTask.day || `Day ${index + 1}`,  
      tasks: (dayTask.tasks || []).map((t: any) => ({
        name: t.name || "",
        description: t.description || "",
        priority: t.priority || "",
        estimatedTime: t.estimatedTime || "",
      })),
    })),
  };
}

http.route({
  path: "/vapi/generate-program",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();

      const {
        user_id,
        age,
        education_level,
        experience_years,
        career_goal,
        skills,
        availability_hours_per_week,
      } = payload;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      });

      // Career plan prompt
      const careerPrompt = `You are an AI Career/Resume Coach creating a personalized career development plan based on:
      Age: ${age}
      Education Level: ${education_level}
      Experience: ${experience_years} years
      Career Goal: ${career_goal}
      Skills: ${skills.join(", ")}
      Availability per week: ${availability_hours_per_week} hours

      CRITICAL SCHEMA INSTRUCTIONS:
      - Return JSON object ONLY with "sections" array
      - Each section: { "title": string, "items": [ { "name": string, "details": string } ] }
      - NO extra fields or text outside JSON
      - Example:
      {
        "sections": [
          {
            "title": "Skill Development",
            "items": [
              { "name": "Learn TypeScript", "details": "3 hours per week for 4 weeks" }
            ]
          }
        ]
      }`;

      const careerResult = await model.generateContent(careerPrompt);
      let careerPlan = JSON.parse(careerResult.response.text());
      careerPlan = validateCareerPlan(careerPlan);

      // Job plan prompt
      const jobPrompt = `You are an AI Career/Resume Coach creating a daily job/task plan for user to achieve career goals:
      Career Goal: ${career_goal}
      Skills: ${skills.join(", ")}
      Availability: ${availability_hours_per_week} hours/week

      CRITICAL SCHEMA INSTRUCTIONS:
      - Return JSON object ONLY with "dailyTasks" array
      - Each task: { "taskName": string, "durationMinutes": number }
      - NO extra fields
      - Example:
      {
        "dailyTasks": [
          { "taskName": "Update LinkedIn Profile", "durationMinutes": 30 }
        ]
      }`;

      const jobResult = await model.generateContent(jobPrompt);
      let jobPlan = JSON.parse(jobResult.response.text());
      jobPlan = validateJobPlan(jobPlan);

      // save to Convex DB
      const planId = await ctx.runMutation(api.plans.createPlan, {
        userId: user_id,
        careerPlan,
        jobPlan,
        isActive: true,
        name: `${career_goal} Plan - ${new Date().toLocaleDateString()}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            planId,
            careerPlan,
            jobPlan,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error generating career plan:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});


export default http;
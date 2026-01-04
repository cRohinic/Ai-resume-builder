import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  plans: defineTable({
    userId: v.string(),
    name: v.string(),

    // Career development plan
    careerPlan: v.object({
      sections: v.array(
        v.object({
          title: v.string(),
          steps: v.array(v.string()), 
        })
      ),
    }),

    // Job/task daily plan
    jobPlan: v.object({
      dailyTasks: v.array(
        v.object({
          day: v.string(),
          tasks: v.array(
            v.object({
              name: v.string(),
              description: v.optional(v.string()),
              priority: v.optional(v.string()), 
              estimatedTime: v.optional(v.string()), 
            })
          ),
        })
      ),
    }),

    isActive: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_active", ["isActive"]),
});
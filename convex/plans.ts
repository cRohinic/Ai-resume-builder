import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    careerPlan: v.object({
      sections: v.array(
        v.object({
          title: v.string(),
          steps: v.array(v.string()),   
        })
      ),
    }),
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
  },
  handler: async (ctx, args) => {
    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const plan of activePlans) {
      await ctx.db.patch(plan._id, { isActive: false });
    }

    return await ctx.db.insert("plans", args);
  },
});

export const getUserPlans = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return plans;
  },
});
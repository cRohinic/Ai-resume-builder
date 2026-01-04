"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

import ProfileHeader from "../components/ProfileHeader";
import NoFitnessPlan from "../components/NoFitnessPlan";
import CornerElements from "../components/CornerElements";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BriefcaseIcon, CalendarIcon, GraduationCapIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const allPlans = useQuery(
    api.plans.getUserPlans,
    userId ? { userId } : "skip"
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const activePlan = allPlans?.find((plan) => plan.isActive);

  const currentPlan = selectedPlanId
    ? allPlans?.find((plan) => plan._id === selectedPlanId)
    : activePlan;

  if (!isLoaded) {
    return null;
  }

  return (
    <section className="relative z-10 pt-12 pb-32 flex-grow container mx-auto px-4">
      <ProfileHeader user={user} />

      {allPlans && allPlans.length > 0 ? (
        <div className="space-y-8">
          {/* PLAN SELECTOR */}
          <div className="relative backdrop-blur-sm border border-border p-6">
            <CornerElements />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="text-primary">Your</span>{" "}
                <span className="text-foreground">Career / Resume Plans</span>
              </h2>
              <div className="font-mono text-xs text-muted-foreground">
                TOTAL: {allPlans.length}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {allPlans.map((plan) => (
                <Button
                  key={plan._id}
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`text-foreground border hover:text-white ${
                    selectedPlanId === plan._id
                      ? "bg-primary/20 text-primary border-primary"
                      : "bg-transparent border-border hover:border-primary/50"
                  }`}
                >
                  {plan.name}
                  {plan.isActive && (
                    <span className="ml-2 bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* PLAN DETAILS */}
          {currentPlan && (
            <div className="relative backdrop-blur-sm border border-border rounded-lg p-6">
              <CornerElements />

              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-lg font-bold">
                  PLAN:{" "}
                  <span className="text-primary">{currentPlan.name}</span>
                </h3>
              </div>

              <Tabs defaultValue="career" className="w-full">
                <TabsList className="mb-6 w-full grid grid-cols-2 bg-cyber-terminal-bg border">
                  <TabsTrigger value="career">
                    <GraduationCapIcon className="mr-2 size-4" />
                    Career Path
                  </TabsTrigger>
                  <TabsTrigger value="job">
                    <BriefcaseIcon className="mr-2 size-4" />
                    Job Plan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="career">
                  <Accordion type="multiple" className="space-y-4">
                    {currentPlan.careerPlan.sections.map((section, index) => (
                      <AccordionItem
                        key={index}
                        value={section.title}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 font-mono">
                          <span className="text-primary">{section.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 px-4">
                          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                            {section.steps.map((step, i) => (
                              <li key={i} className="text-sm">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="job">
                  <div className="space-y-4">
                    {currentPlan.jobPlan.dailyTasks.map((taskDay, index) => (
                      <div
                        key={index}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          <h4 className="font-mono text-primary">
                            {taskDay.day}
                          </h4>
                        </div>
                        <ul className="space-y-3">
                          {taskDay.tasks.map((task, i) => (
                            <li
                              key={i}
                              className="border border-border rounded p-3 bg-background/50"
                            >
                              <h5 className="font-semibold">
                                {task.name}
                              </h5>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                              {task.estimatedTime && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {task.estimatedTime}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      ) : (
        <NoFitnessPlan />
      )}
    </section>
  );
}

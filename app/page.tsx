"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OverviewPage from "./overview/page";

export default function RootPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        if (typeof window !== "undefined") {
          let completed = localStorage.getItem("dwell_onboarding_completed") === "true";
          if (window.electronAPI) {
            const settings = await window.electronAPI.invoke("get-app-settings");
            if (typeof settings?.onboardingCompleted === "boolean") {
              completed = settings.onboardingCompleted;
            }
          }
          if (!completed) {
            router.replace("/onboarding");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check onboarding state:", err);
      }
      setReady(true);
    }

    checkStatus();
  }, [router]);

  if (!ready) {
    return <div className="w-full h-full bg-(--md-sys-color-background)" />;
  }

  return <OverviewPage />;
}

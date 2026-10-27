"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { M3Button, M3Switch } from "@/components/material";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadInitialSettings() {
      try {
        if (typeof window !== "undefined" && window.electronAPI) {
          const settings = await window.electronAPI.invoke("get-app-settings");
          if (settings) {
            if (typeof settings.startOnBoot === "boolean") {
              setStartOnBoot(settings.startOnBoot);
            }
            if (typeof settings.startMinimized === "boolean") {
              setStartMinimized(settings.startMinimized);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial settings:", err);
      }
    }

    loadInitialSettings();
  }, []);

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("dwell_onboarding_completed", "true");
        if (window.electronAPI) {
          await window.electronAPI.invoke("set-app-settings", {
            startOnBoot: startOnBoot,
            startMinimized: startOnBoot ? startMinimized : false,
            onboardingCompleted: true,
          });
        }
      }
    } catch (err) {
      console.error("Error saving onboarding settings:", err);
    } finally {
      router.push("/overview");
    }
  };

  if (!mounted) {
    return <div className="w-screen h-screen bg-[#0E141B]" />;
  }

  return (
    <main className="flex flex-col items-center justify-center w-screen h-screen bg-[#0E141B] text-[#E1E2E8] px-6 select-none">
      {/* Clean Step Indicator */}
      <div className="absolute top-8 flex items-center gap-1.5">
        <span
          className={`h-1.5 rounded-full transition-all duration-200 ${
            step === 1 ? "w-6 bg-[#96CCFF]" : "w-1.5 bg-[#42474E]"
          }`}
        />
        <span
          className={`h-1.5 rounded-full transition-all duration-200 ${
            step === 2 ? "w-6 bg-[#96CCFF]" : "w-1.5 bg-[#42474E]"
          }`}
        />
      </div>

      {step === 1 ? (
        /* STEP 1: Welcome */
        <div className="flex flex-col items-center max-w-lg text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
            Welcome to Dwell
          </h1>

          <p className="text-sm sm:text-base text-[#C2C7CF] leading-relaxed mb-8 max-w-md">
            Ever wondered how much time you&apos;ve spent using your computer
            this day and what applications you used the most?
            <br className="hidden sm:inline" />
            <span className="text-white font-medium"> Dwell</span> is here to
            help you track your screen time and productivity.
          </p>

          <div>
            <M3Button
              variant="filled"
              icon="arrow_forward"
              trailingIcon
              onClick={() => setStep(2)}
            >
              Next
            </M3Button>
          </div>
        </div>
      ) : (
        /* STEP 2: Startup Configuration */
        <div className="flex flex-col items-center w-full max-w-md">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2 text-center">
            Startup Preferences
          </h2>

          <p className="text-sm text-[#C2C7CF] mb-8 text-center max-w-sm">
            Choose how Dwell runs when you start your computer.
          </p>

          {/* Clean Settings Card */}
          <div className="w-full flex flex-col rounded-2xl bg-[#161D24] border border-[#242C34] overflow-hidden mb-8 divide-y divide-[#242C34]">
            {/* Setting 1: Start on Windows start */}
            <div className="flex items-center justify-between p-4 sm:p-5 gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="material-symbols-outlined text-xl shrink-0 text-[#96CCFF]">
                  rocket_launch
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    Start on Windows start
                  </span>
                  <span className="text-xs text-[#8C9199]">
                    Launch Dwell automatically when you sign in
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <M3Switch
                  id="start-on-boot-switch"
                  selected={startOnBoot}
                  onChange={(val) => {
                    setStartOnBoot(val);
                    if (!val) {
                      setStartMinimized(false);
                    }
                  }}
                />
              </div>
            </div>

            {/* Setting 2: Start minimized (Conditional on Setting 1) */}
            {startOnBoot && (
              <div className="flex items-center justify-between p-4 sm:p-5 gap-4 transition-all duration-200">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="material-symbols-outlined text-xl shrink-0 text-[#96CCFF]">
                    vertical_align_bottom
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      Start minimized
                    </span>
                    <span className="text-xs text-[#8C9199]">
                      Keep Dwell in the system tray on startup
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  <M3Switch
                    id="start-minimized-switch"
                    selected={startMinimized}
                    onChange={(val) => setStartMinimized(val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Symmetrical Action Buttons with matched sizing */}
          <div className="flex items-center justify-between w-full">
            <M3Button
              variant="tonal"
              icon="arrow_back"
              onClick={() => setStep(1)}
              disabled={saving}
            >
              Back
            </M3Button>

            <M3Button
              variant="filled"
              icon="check"
              trailingIcon
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? "Saving..." : "Get Started"}
            </M3Button>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { M3Switch, M3Button } from "@/components/material";

export default function SettingsPage() {
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        if (typeof window !== "undefined" && window.electronAPI) {
          const settings = await window.electronAPI.invoke("get-app-settings");
          if (settings) {
            setStartOnBoot(!!settings.startOnBoot);
            setStartMinimized(!!settings.startMinimized);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const updateSettings = async (newBoot: boolean, newMinimized: boolean) => {
    setStartOnBoot(newBoot);
    setStartMinimized(newMinimized);
    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        await window.electronAPI.invoke("set-app-settings", {
          startOnBoot: newBoot,
          startMinimized: newBoot ? newMinimized : false,
        });
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return (
    <main className="flex flex-col w-full h-[calc(100vh-40px)] p-5 mt-5 mb-5 mr-5 rounded-4xl bg-(--md-sys-color-surface-container) overflow-y-auto custom-scrollbar">
      <header className="flex flex-col p-4 rounded-2xl bg-(--md-sys-color-surface-container-high)">
        <h1 className="text-4xl uppercase font-semibold text-(--md-sys-color-tertiary)">
          Settings
        </h1>
        <p className="ml-1 text-(--md-sys-color-on-surface-variant) text-sm">
          Manage your application preferences and behavior.
        </p>
      </header>

      <hr className="h-px mt-4 mb-4 border-0 bg-(--md-sys-color-primary) rounded" />

      <div className="flex flex-col gap-6 p-6 rounded-2xl bg-(--md-sys-color-surface-container-high)">
        <section>
          <h2 className="text-xl font-semibold text-(--md-sys-color-primary) mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">
              power_settings_new
            </span>
            Startup Behavior
          </h2>

          <div className="flex flex-col gap-3">
            {/* Start on Windows startup */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)">
                  <span className="material-symbols-outlined text-xl">
                    rocket_launch
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Start on Windows start
                  </h3>
                  <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                    Launch Dwell automatically when you log in to Windows
                  </p>
                </div>
              </div>
              <M3Switch
                id="settings-boot-switch"
                selected={startOnBoot}
                onChange={(val) =>
                  updateSettings(val, val ? startMinimized : false)
                }
              />
            </div>

            {/* Start Minimized (conditional on start on boot) */}
            {startOnBoot && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container)">
                    <span className="material-symbols-outlined text-xl">
                      vertical_align_bottom
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Start minimized
                    </h3>
                    <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                      Start silently in the system tray without opening a window
                    </p>
                  </div>
                </div>
                <M3Switch
                  id="settings-minimized-switch"
                  selected={startMinimized}
                  onChange={(val) => updateSettings(startOnBoot, val)}
                />
              </div>
            )}
          </div>
        </section>

        <hr className="h-px border-0 bg-(--md-sys-color-outline-variant)/30" />

        <section className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Walkthrough</h3>
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              Go through the onboarding process again
            </p>
          </div>
          <Link href="/onboarding">
            <M3Button variant="tonal" icon="explore">
              View Onboarding
            </M3Button>
          </Link>
        </section>
      </div>
    </main>
  );
}

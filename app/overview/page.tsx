"use client";

import { useEffect, useState } from "react";
import type { ScreenTimeStats } from "@/types/electron";

function formatDetailedDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return "0 Seconds";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (minutes > 0)
    parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`);
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? "Second" : "Seconds"}`);
  }

  return parts.join(", ");
}

/**
 * Returns the usage time for a given app name, formatted cleanly.
 * If rawSeconds is true, returns the number of seconds instead.
 */
function getAppUsageTime(
  appName: string,
  apps: ScreenTimeStats["apps"],
): string;
function getAppUsageTime(
  appName: string,
  apps: ScreenTimeStats["apps"],
  rawSeconds: true,
): number;
function getAppUsageTime(
  appName: string,
  apps: ScreenTimeStats["apps"],
  rawSeconds?: boolean,
): string | number {
  const app = apps.find((a) => a.name.toLowerCase() === appName.toLowerCase());
  const seconds = app ? app.seconds : 0;
  if (rawSeconds) return seconds;
  return formatDetailedDuration(seconds);
}

export default function OverviewPage() {
  const [stats, setStats] = useState<ScreenTimeStats>({
    totalSeconds: 0,
    totalFormatted: "0s",
    apps: [],
  });

  useEffect(() => {
    // Initial fetch from main process
    if (typeof window !== "undefined" && window.electronAPI?.invoke) {
      window.electronAPI
        .invoke("get-screen-time")
        .then((data: ScreenTimeStats) => {
          if (data) setStats(data);
        })
        .catch(() => {});

      // Real-time broadcast listener
      const unsubscribe = window.electronAPI.on(
        "screen-time-update",
        (data: ScreenTimeStats) => {
          if (data) setStats(data);
        },
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  return (
    <main className="flex flex-col flex-1 h-[calc(100vh-40px)] min-h-0 p-5 mt-5 mb-5 mr-5 rounded-4xl bg-(--md-sys-color-surface-container) overflow-hidden">
      <header className="flex flex-col shrink-0 p-4 rounded-2xl bg-(--md-sys-color-surface-container-high)">
        <h1 className="text-4xl uppercase font-semibold text-(--md-sys-color-tertiary)">
          Your Overview
        </h1>
        <p className="ml-1 text-(--md-sys-color-on-surface-variant) text-sm">
          Have a quick oversight on where you&apos;re spending your time while
          using your computer.
        </p>
      </header>
      <hr className="shrink-0 h-px mt-4 mb-4 border-0 bg-(--md-sys-color-primary) rounded" />
      <div className="flex flex-col flex-1 min-h-0 p-8 rounded-2xl bg-(--md-sys-color-surface-container-high) overflow-hidden">
        <div className="shrink-0">
          <h1 className="text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-3">
            Total Time Spent
          </h1>
          <h2 className="text-6xl xl:text-6xl lg:text-5xl uppercase font-bold text-(--md-sys-color-primary) tracking-tight">
            {formatDetailedDuration(stats.totalSeconds)}
          </h2>
          <hr className="mt-5 mb-5 ml-10 w-[45%] border-(--md-sys-color-tertiary) rounded" />

          <h1 className="text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-3">
            Most Used Apps
          </h1>
        </div>

        <div className="flex flex-col bg-(--md-sys-color-on-primary-container) text-(--md-sys-color-surface) text-2xl p-5 w-[70%] lg:w-[90%] xl:w-[70%] rounded-xl overflow-y-auto pr-3 custom-scrollbar">
          {stats.apps.length === 0 ? (
            <p className="text-lg opacity-70">No app usage recorded yet.</p>
          ) : (
            <ul>
              {stats.apps.slice(0, 5).map((app, index) => (
                <li key={`${app.name}-${index}`} className="list-none">
                  <div className="flex justify-between items-center py-1">
                    <span className="truncate pr-4">{app.name}</span>
                    <span className="shrink-0 text-xl font-medium">
                      {formatDetailedDuration(app.seconds)}
                    </span>
                  </div>
                  {index < Math.min(stats.apps.length, 5) - 1 && (
                    <hr className="mt-2 mb-2 border-(--md-sys-color-on-tertiary) rounded" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <hr className="mt-5 mb-5 ml-10 w-[45%] border-(--md-sys-color-tertiary) rounded" />
      </div>
    </main>
  );
}

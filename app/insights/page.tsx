"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScreenTimeStats } from "@/types/electron";
import { M3SegmentedButton } from "@/components/material";

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

interface WeekDayItem {
  dateKey: string;
  label: string;
  dayName: string;
  dayNum: string;
  fullTitle: string;
  isToday: boolean;
}

function getCurrentWeekDays(referenceDate?: string): WeekDayItem[] {
  let now = new Date();
  if (referenceDate) {
    const parts = referenceDate.split("-").map(Number);
    if (
      parts.length === 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      now = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  // Monday is start of the current week: distance from Monday (0 to 6)
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const realToday = new Date();
  const realTodayY = realToday.getFullYear();
  const realTodayM = String(realToday.getMonth() + 1).padStart(2, "0");
  const realTodayD = String(realToday.getDate()).padStart(2, "0");
  const activeTodayKey =
    referenceDate || `${realTodayY}-${realTodayM}-${realTodayD}`;

  const days: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const label = `${day}, ${dayName}`; // e.g. "26, Mon"

    days.push({
      dateKey,
      label,
      dayName,
      dayNum: day,
      fullTitle: d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      isToday: dateKey === activeTodayKey,
    });
  }

  return days;
}

export default function InsightsPage() {
  const [selectedSegment, setSelectedSegment] = useState(0); // 0 = Day, 1 = Week
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 to 6 (Monday to Sunday)
  const [stats, setStats] = useState<ScreenTimeStats>({
    date: "",
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

  const [weekDays, setWeekDays] = useState<WeekDayItem[]>([]);

  useEffect(() => {
    const days = getCurrentWeekDays(stats.date);
    setWeekDays(days);
    const todayIdx = days.findIndex((d) => d.isToday);
    if (todayIdx !== -1) {
      setSelectedDayIndex(todayIdx);
    }
  }, [stats.date]);

  const selectedDay = weekDays[selectedDayIndex] || weekDays[0] || {
    dateKey: "",
    label: "",
    dayName: "",
    dayNum: "",
    fullTitle: "Today",
    isToday: true,
  };

  const selectedDayStats = useMemo<ScreenTimeStats>(() => {
    if (!selectedDay) {
      return { totalSeconds: 0, totalFormatted: "0s", apps: [] };
    }
    if (stats.allStats && stats.allStats[selectedDay.dateKey]) {
      return stats.allStats[selectedDay.dateKey];
    }
    if (stats.date === selectedDay.dateKey) {
      return stats;
    }
    return {
      date: selectedDay.dateKey,
      totalSeconds: 0,
      totalFormatted: "0s",
      apps: [],
    };
  }, [selectedDay, stats]);

  const { weekTotalSeconds, dailyAvgSeconds } = useMemo(() => {
    let total = 0;
    let activeDaysCount = 0;

    for (const day of weekDays) {
      let daySecs = 0;
      if (stats.allStats && stats.allStats[day.dateKey]) {
        daySecs = stats.allStats[day.dateKey].totalSeconds || 0;
      } else if (stats.date === day.dateKey) {
        daySecs = stats.totalSeconds || 0;
      }
      total += daySecs;
      if (daySecs > 0) activeDaysCount++;
    }

    const avg =
      activeDaysCount > 0 ? Math.round(total / activeDaysCount) : 0;
    return { weekTotalSeconds: total, dailyAvgSeconds: avg };
  }, [weekDays, stats]);

  return (
    <main className="flex flex-col flex-1 h-[calc(100vh-40px)] min-h-0 p-4 2xl:p-5 mt-5 mb-5 mr-5 rounded-4xl bg-(--md-sys-color-surface-container) overflow-hidden">
      <header className="flex flex-col shrink-0 p-3 2xl:p-4 rounded-2xl bg-(--md-sys-color-surface-container-high)">
        <h1 className="text-3xl 2xl:text-4xl uppercase font-semibold text-(--md-sys-color-tertiary)">
          Detailed Insights
        </h1>
        <p className="ml-1 text-(--md-sys-color-on-surface-variant) text-xs 2xl:text-sm">
          Analyze your screen time and app usage statistics in depth.
        </p>
      </header>
      <hr className="shrink-0 h-px my-2.5 2xl:my-4 border-0 bg-(--md-sys-color-primary) rounded" />
      <div className="flex flex-col flex-1 min-h-0 p-4 lg:p-6 2xl:p-8 rounded-2xl bg-(--md-sys-color-surface-container-high) overflow-hidden">
        {/* Top Control Bar: Day/Week Toggle + Inline Week Aggregate Stats */}
        <div className="shrink-0 flex items-center justify-between gap-4 mb-3 2xl:mb-4">
          <M3SegmentedButton
            options={[
              { label: "Day", icon: "today" },
              { label: "Week", icon: "date_range" },
            ]}
            selectedIndex={selectedSegment}
            onChange={(idx) => setSelectedSegment(idx)}
          />

          {selectedSegment === 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--md-sys-color-surface-container-highest) border border-(--md-sys-color-outline-variant)/30">
                <span className="font-semibold text-(--md-sys-color-secondary) uppercase text-[10px] 2xl:text-xs tracking-wider">
                  Week Total:
                </span>
                <span className="font-bold text-(--md-sys-color-primary) text-xs 2xl:text-sm">
                  {formatDetailedDuration(weekTotalSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--md-sys-color-surface-container-highest) border border-(--md-sys-color-outline-variant)/30">
                <span className="font-semibold text-(--md-sys-color-secondary) uppercase text-[10px] 2xl:text-xs tracking-wider">
                  Daily Avg:
                </span>
                <span className="font-bold text-(--md-sys-color-primary) text-xs 2xl:text-sm">
                  {formatDetailedDuration(dailyAvgSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>

        {selectedSegment === 0 ? (
          <>
            <div className="shrink-0">
              <h1 className="text-2xl 2xl:text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-1 2xl:mb-2">
                Today&apos;s Total
              </h1>
              <h2 className="text-4xl 2xl:text-5xl uppercase font-bold text-(--md-sys-color-primary) tracking-tight mb-2 2xl:mb-4">
                {formatDetailedDuration(stats.totalSeconds)}
              </h2>
              <hr className="mb-3 2xl:mb-4 ml-6 2xl:ml-10 w-[45%] border-(--md-sys-color-tertiary) rounded" />
              <h1 className="shrink-0 text-2xl 2xl:text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-2 2xl:mb-3">
                Each App&apos;s Usage
              </h1>
            </div>

            <div className="flex flex-col bg-(--md-sys-color-on-primary-container) text-(--md-sys-color-surface) text-xl 2xl:text-2xl p-4 2xl:p-5 w-[70%] lg:w-[90%] xl:w-[70%] rounded-xl max-h-[220px] 2xl:max-h-[305px] overflow-y-auto pr-3 custom-scrollbar">
              {stats.apps.length === 0 ? (
                <p className="text-base 2xl:text-lg opacity-70">
                  No app usage recorded for today yet.
                </p>
              ) : (
                <ul>
                  {stats.apps.map((app, index) => (
                    <li key={`${app.name}-${index}`} className="list-none">
                      <div className="flex justify-between items-center py-1">
                        <span className="truncate pr-4">{app.name}</span>
                        <span className="shrink-0 text-lg 2xl:text-xl font-medium">
                          {formatDetailedDuration(app.seconds)}
                        </span>
                      </div>
                      {index < stats.apps.length - 1 && (
                        <hr className="mt-1.5 mb-1.5 2xl:mt-2 2xl:mb-2 border-(--md-sys-color-on-tertiary) rounded" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Week Days Segmented Button */}
            <div className="shrink-0 mb-3 2xl:mb-4">
              <M3SegmentedButton
                options={weekDays.map((d) => ({
                  label: d.label,
                }))}
                selectedIndex={selectedDayIndex}
                onChange={(idx) => setSelectedDayIndex(idx)}
                noCheckmark={true}
              />
            </div>

            {/* Selected Day Stats */}
            <div className="shrink-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl 2xl:text-3xl uppercase font-semibold text-(--md-sys-color-secondary)">
                  {selectedDay.fullTitle}
                </h1>
                {selectedDay.isToday && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)">
                    Today
                  </span>
                )}
              </div>

              <h2 className="text-4xl 2xl:text-5xl uppercase font-bold text-(--md-sys-color-primary) tracking-tight mb-2 2xl:mb-4">
                {formatDetailedDuration(selectedDayStats.totalSeconds)}
              </h2>
              <hr className="mb-3 2xl:mb-4 ml-6 2xl:ml-10 w-[45%] border-(--md-sys-color-tertiary) rounded" />
              <h1 className="shrink-0 text-2xl 2xl:text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-2 2xl:mb-3">
                Each App&apos;s Usage
              </h1>
            </div>

            {/* App Usage Container (styled scrollbar only when > 5 items on small height, > 7 on large height) */}
            <div className="flex flex-col bg-(--md-sys-color-on-primary-container) text-(--md-sys-color-surface) text-xl 2xl:text-2xl p-4 2xl:p-5 w-[70%] lg:w-[90%] xl:w-[70%] rounded-xl max-h-[180px] 2xl:max-h-[285px] overflow-y-auto pr-3 custom-scrollbar">
              {selectedDayStats.apps.length === 0 ? (
                <p className="text-base 2xl:text-lg opacity-70">
                  No app usage recorded for this day.
                </p>
              ) : (
                <ul>
                  {selectedDayStats.apps.map((app, index) => (
                    <li key={`${app.name}-${index}`} className="list-none">
                      <div className="flex justify-between items-center py-1">
                        <span className="truncate pr-4">{app.name}</span>
                        <span className="shrink-0 text-lg 2xl:text-xl font-medium">
                          {formatDetailedDuration(app.seconds)}
                        </span>
                      </div>
                      {index < selectedDayStats.apps.length - 1 && (
                        <hr className="mt-1.5 mb-1.5 2xl:mt-2 2xl:mb-2 border-(--md-sys-color-on-tertiary) rounded" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

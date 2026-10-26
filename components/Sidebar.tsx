"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NavTabs = dynamic(
  () => import("@/components/material").then((mod) => mod.NavTabs),
  { ssr: false },
);

const M3Fab = dynamic(
  () => import("@/components/material").then((mod) => mod.M3Fab),
  { ssr: false },
);

const routes: Record<string, string> = {
  overview: "/overview",
  detail: "/insights",
  settings: "/settings",
};

const STORAGE_KEY = "dwell_sidebar_collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const getActiveTab = () => {
    if (pathname?.startsWith("/insights")) return "detail";
    if (pathname?.startsWith("/settings")) return "settings";
    return "overview";
  };

  const handleTabChange = (id: string) => {
    const target = routes[id];
    if (target && target !== pathname) {
      router.push(target);
    }
  };

  return (
    <aside
      className={`flex flex-col h-[calc(100vh-40px)] m-5 align-center rounded-4xl bg-(--md-sys-color-surface-container) transition-[width,padding] duration-300 ease-in-out shrink-0 overflow-hidden ${
        collapsed ? "w-[104px] p-2" : "w-[270px] p-3"
      }`}
    >
      <div
        className={`rounded-2xl bg-(--md-sys-color-surface-container-high) transition-[padding] duration-300 ease-in-out flex flex-col ${
          collapsed ? "p-2 items-center" : "p-4"
        }`}
      >
        <div
          className={`flex items-center transition-[gap] duration-300 ease-in-out ${
            collapsed ? "gap-0 justify-center" : "gap-4"
          }`}
        >
          <div className="shrink-0">
            <M3Fab icon="menu" variant="primary" onClick={toggleCollapsed} />
          </div>
          <h1
            className={`text-3xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed
                ? "max-w-0 opacity-0 pointer-events-none"
                : "max-w-[200px] opacity-100"
            }`}
          >
            <Link href="/overview">Dwell</Link>
          </h1>
        </div>
        <hr className="h-px mt-6 mb-2 border-0 bg-(--md-sys-color-primary) rounded w-full" />
        <NavTabs
          title=" "
          collapsed={collapsed}
          items={[
            { id: "overview", label: "Overview", icon: "dashboard" },
            {
              id: "detail",
              label: "Detailed Insights",
              icon: "query_stats",
            },
          ]}
          activeId={getActiveTab()}
          onChange={handleTabChange}
        />
      </div>
      <div
        className={`mt-auto rounded-2xl bg-(--md-sys-color-surface-container-high) transition-[padding] duration-300 ease-in-out flex flex-col ${
          collapsed ? "p-2 items-center" : "p-4"
        }`}
      >
        <NavTabs
          title=""
          collapsed={collapsed}
          items={[{ id: "settings", label: "Settings", icon: "settings" }]}
          activeId={getActiveTab()}
          onChange={handleTabChange}
        />
      </div>
    </aside>
  );
}

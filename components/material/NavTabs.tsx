'use client';

import React from 'react';
import '@material/web/ripple/ripple.js';

export interface NavTabItem {
  id: string;
  label: string;
  icon: string;
}

export interface NavTabsProps {
  /** Optional title displayed at the top (defaults to 'LocalSend') */
  title?: string;
  /** List of tab items to render */
  items: NavTabItem[];
  /** Currently active tab ID */
  activeId: string;
  /** Callback fired when a tab is clicked */
  onChange: (id: string) => void;
  /** Optional custom active accent color (e.g. '#38bdf8' or '#96ccff'). Defaults to theme blue if omitted */
  color?: string;
  /** Optional custom pill container background color (e.g. '#253745'). Defaults to theme if omitted */
  pillColor?: string;
  /** Whether the sidebar is collapsed (icons only) */
  collapsed?: boolean;
  /** Optional className for the container */
  className?: string;
}

export function NavTabs({
  title = 'LocalSend',
  items,
  activeId,
  onChange,
  color,
  pillColor,
  collapsed = false,
  className = '',
}: NavTabsProps) {
  return (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {title && (
        <h2 className="text-2xl font-extrabold tracking-tight text-white px-2 mb-6 select-none">
          {title}
        </h2>
      )}

      {items.map((tab) => {
        const isActive = activeId === tab.id;

        // Custom colors if provided, otherwise default to dark blue theme
        const activeIconColor = color || '#96CCFF';
        const activePillBg = pillColor || (color ? `${color}33` : '#253745');

        const buttonId = `nav-tab-${tab.id}`;

        return (
          <button
            key={tab.id}
            id={buttonId}
            type="button"
            title={collapsed ? tab.label : undefined}
            onClick={() => onChange(tab.id)}
            className={`flex items-center rounded-2xl transition-[colors,padding] duration-300 ease-in-out text-left group select-none ${
              collapsed ? 'p-1 justify-center' : 'w-full gap-4 px-2 py-2'
            } ${
              isActive ? 'text-white' : 'text-[#8C9199] hover:text-[#E1E2E8]'
            }`}
          >
            {/* The Chip containing the logo has the ripple animation */}
            <div
              className="relative overflow-hidden w-14 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shrink-0"
              style={{
                backgroundColor: isActive ? activePillBg : 'transparent',
                color: isActive ? activeIconColor : '#8C9199',
              }}
            >
              {/* Ripple animation strictly confined to this chip */}
              <md-ripple for={buttonId}></md-ripple>

              <span className="material-symbols-outlined text-[20px] pointer-events-none select-none">
                {tab.icon}
              </span>
            </div>

            {/* Label with smooth transition for width and opacity */}
            <span
              className={`text-sm tracking-wide pointer-events-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
              } ${
                isActive ? 'font-semibold text-white' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default NavTabs;

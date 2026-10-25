'use client';

import React from 'react';
import '@material/web/fab/fab.js';
import '@material/web/fab/branded-fab.js';
import '@material/web/icon/icon.js';

export interface M3FabProps {
  /** Optional text label for extended FAB */
  label?: string;
  /** Material Symbols icon name (e.g. 'add', 'edit', 'navigation') */
  icon?: string;
  /** FAB variant: primary, secondary, tertiary, or branded (defaults to primary) */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'branded';
  /** If true, renders a lowered FAB with less elevation */
  lowered?: boolean;
  /** Custom background container color (e.g. '#0284c7'). Defaults to theme if omitted */
  color?: string;
  /** Custom icon and label text color. Defaults to theme if omitted */
  textColor?: string;
  /** Click event handler */
  onClick?: () => void;
  className?: string;
}

export function M3Fab({
  label,
  icon,
  variant = 'primary',
  lowered = false,
  color,
  textColor,
  onClick,
  className = '',
}: M3FabProps) {
  const customStyles: Record<string, string> = {};
  if (color) {
    customStyles['--md-fab-container-color'] = color;
  }
  if (textColor) {
    customStyles['--md-fab-icon-color'] = textColor;
    customStyles['--md-fab-label-text-color'] = textColor;
  }

  if (variant === 'branded') {
    return (
      <md-branded-fab
        label={label}
        lowered={lowered || undefined}
        onClick={onClick}
        style={customStyles}
        class={className}
      >
        {icon && <md-icon slot="icon">{icon}</md-icon>}
      </md-branded-fab>
    );
  }

  return (
    <md-fab
      label={label}
      variant={variant}
      lowered={lowered || undefined}
      onClick={onClick}
      style={customStyles}
      class={className}
    >
      {icon && <md-icon slot="icon">{icon}</md-icon>}
    </md-fab>
  );
}

export default M3Fab;

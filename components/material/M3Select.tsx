'use client';

import React from 'react';
import '@material/web/select/outlined-select.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

export interface SelectOption {
  label: string;
  value: string;
}

export interface M3SelectProps {
  /** Dropdown label text */
  label: string;
  /** List of selectable options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Select style variant: outlined or filled (defaults to outlined) */
  variant?: 'outlined' | 'filled';
  /** Custom focus outline / active indicator color (e.g. '#38BDF8'). Defaults to theme if omitted */
  color?: string;
  /** Callback fired when selected option changes */
  onChange?: (value: string) => void;
  className?: string;
}

export function M3Select({
  label,
  options,
  value,
  variant = 'outlined',
  color,
  onChange,
  className = '',
}: M3SelectProps) {
  const styles: Record<string, string> = {};
  if (color) {
    if (variant === 'outlined') {
      styles['--md-outlined-select-focus-outline-color'] = color;
      styles['--md-outlined-select-focus-label-text-color'] = color;
    } else {
      styles['--md-filled-select-focus-active-indicator-color'] = color;
      styles['--md-filled-select-focus-label-text-color'] = color;
    }
  }

  const renderOptions = () =>
    options.map((opt) => (
      <md-select-option
        key={opt.value}
        value={opt.value}
        selected={value === opt.value || undefined}
      >
        <div slot="headline">{opt.label}</div>
      </md-select-option>
    ));

  if (variant === 'filled') {
    return (
      <md-filled-select
        label={label}
        value={value}
        style={styles}
        class={className}
        onChange={(e: any) => onChange?.(e.target.value)}
      >
        {renderOptions()}
      </md-filled-select>
    );
  }

  return (
    <md-outlined-select
      label={label}
      value={value}
      style={styles}
      class={className}
      onChange={(e: any) => onChange?.(e.target.value)}
    >
      {renderOptions()}
    </md-outlined-select>
  );
}

export default M3Select;

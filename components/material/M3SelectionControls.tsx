'use client';

import React from 'react';
import '@material/web/checkbox/checkbox.js';
import '@material/web/radio/radio.js';
import '@material/web/switch/switch.js';
import '@material/web/slider/slider.js';

// ─── CHECKBOX ───
export interface M3CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  label?: string;
  id?: string;
  /** Custom checked container color (e.g. '#38BDF8'). Defaults to theme if omitted */
  color?: string;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function M3Checkbox({
  checked = false,
  indeterminate = false,
  label,
  id,
  color,
  onChange,
  className = '',
}: M3CheckboxProps) {
  const styles: Record<string, string> = {};
  if (color) {
    styles['--md-checkbox-selected-container-color'] = color;
    styles['--md-checkbox-selected-icon-color'] = '#FFFFFF';
  }

  return (
    <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium select-none ${className}`}>
      <md-checkbox
        id={id}
        checked={checked || undefined}
        indeterminate={indeterminate || undefined}
        style={styles}
        onClick={(e: any) => onChange?.(e.target.checked)}
      ></md-checkbox>
      {label && <span>{label}</span>}
    </label>
  );
}

// ─── RADIO ───
export interface M3RadioProps {
  name: string;
  value: string;
  checked?: boolean;
  label?: string;
  id?: string;
  /** Custom active radio color (e.g. '#38BDF8'). Defaults to theme if omitted */
  color?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function M3Radio({
  name,
  value,
  checked = false,
  label,
  id,
  color,
  onChange,
  className = '',
}: M3RadioProps) {
  const styles: Record<string, string> = {};
  if (color) {
    styles['--md-radio-selected-icon-color'] = color;
  }

  return (
    <label className={`flex items-center gap-2 cursor-pointer text-sm font-medium select-none ${className}`}>
      <md-radio
        id={id}
        name={name}
        value={value}
        checked={checked || undefined}
        style={styles}
        onClick={() => onChange?.(value)}
      ></md-radio>
      {label && <span>{label}</span>}
    </label>
  );
}

// ─── SWITCH ───
export interface M3SwitchProps {
  selected?: boolean;
  icons?: boolean;
  label?: string;
  id?: string;
  /** Custom active switch track/handle color (e.g. '#38BDF8'). Defaults to theme if omitted */
  color?: string;
  onChange?: (selected: boolean) => void;
  className?: string;
}

export function M3Switch({
  selected = false,
  icons = true,
  label,
  id,
  color,
  onChange,
  className = '',
}: M3SwitchProps) {
  const styles: Record<string, string> = {};
  if (color) {
    styles['--md-switch-selected-track-color'] = color;
    styles['--md-switch-selected-handle-color'] = '#FFFFFF';
  }

  return (
    <label className={`flex items-center gap-3 cursor-pointer text-sm font-medium select-none ${className}`}>
      <md-switch
        id={id}
        selected={selected || undefined}
        icons={icons || undefined}
        show-only-selected-icon
        style={styles}
        onClick={() => onChange?.(!selected)}
      ></md-switch>
      {label && <span>{label}</span>}
    </label>
  );
}

// ─── SLIDER ───
export interface M3SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  ticks?: boolean;
  labeled?: boolean;
  label?: string;
  /** Custom active track and handle color (e.g. '#38BDF8'). Defaults to theme if omitted */
  color?: string;
  onChange?: (val: number) => void;
  className?: string;
}

export function M3Slider({
  value = 50,
  min = 0,
  max = 100,
  step,
  ticks = false,
  labeled = true,
  label,
  color,
  onChange,
  className = '',
}: M3SliderProps) {
  const styles: Record<string, string> = {};
  if (color) {
    styles['--md-slider-active-track-color'] = color;
    styles['--md-slider-handle-color'] = color;
    styles['--md-slider-focus-handle-color'] = color;
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || labeled) && (
        <div className="flex justify-between text-xs font-semibold text-[#8C9199]">
          <span>{label}</span>
          <span className="font-mono text-[#96CCFF]">{value}</span>
        </div>
      )}
      <md-slider
        min={min}
        max={max}
        step={step}
        value={value}
        ticks={ticks || undefined}
        labeled={labeled || undefined}
        style={styles}
        onInput={(e: any) => onChange?.(Number(e.target.value))}
      ></md-slider>
    </div>
  );
}

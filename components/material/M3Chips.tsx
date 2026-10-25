'use client';

import React from 'react';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/input-chip.js';
import '@material/web/chips/suggestion-chip.js';
import '@material/web/icon/icon.js';

export interface ChipItem {
  id: string;
  label: string;
  icon?: string;
  type?: 'assist' | 'filter' | 'input' | 'suggestion';
  selected?: boolean;
}

export interface M3ChipsProps {
  /** Array of chip items */
  items: ChipItem[];
  /** Callback fired when a chip is clicked/toggled */
  onSelect?: (id: string) => void;
  /** Callback fired when an input chip's remove button is clicked */
  onRemove?: (id: string) => void;
  /** Custom selected chip container color (e.g. '#004A76'). Defaults to theme if omitted */
  color?: string;
  className?: string;
}

export function M3Chips({
  items,
  onSelect,
  onRemove,
  color,
  className = '',
}: M3ChipsProps) {
  const styles: Record<string, string> = {};
  if (color) {
    styles['--md-filter-chip-selected-container-color'] = color;
    styles['--md-filter-chip-selected-label-text-color'] = '#FFFFFF';
    styles['--md-assist-chip-icon-color'] = color;
  }

  return (
    <div className={className} style={styles}>
      <md-chip-set>
        {items.map((chip) => {
          const type = chip.type || 'assist';

          if (type === 'filter') {
            return (
              <md-filter-chip
                key={chip.id}
                label={chip.label}
                selected={chip.selected || undefined}
                onClick={() => onSelect?.(chip.id)}
              >
                {chip.icon && <md-icon slot="icon">{chip.icon}</md-icon>}
              </md-filter-chip>
            );
          }

          if (type === 'input') {
            return (
              <md-input-chip
                key={chip.id}
                label={chip.label}
                remove-only
                onRemove={() => onRemove?.(chip.id)}
              >
                {chip.icon && <md-icon slot="icon">{chip.icon}</md-icon>}
              </md-input-chip>
            );
          }

          if (type === 'suggestion') {
            return (
              <md-suggestion-chip
                key={chip.id}
                label={chip.label}
                onClick={() => onSelect?.(chip.id)}
              >
                {chip.icon && <md-icon slot="icon">{chip.icon}</md-icon>}
              </md-suggestion-chip>
            );
          }

          return (
            <md-assist-chip
              key={chip.id}
              label={chip.label}
              onClick={() => onSelect?.(chip.id)}
            >
              {chip.icon && <md-icon slot="icon">{chip.icon}</md-icon>}
            </md-assist-chip>
          );
        })}
      </md-chip-set>
    </div>
  );
}

export default M3Chips;

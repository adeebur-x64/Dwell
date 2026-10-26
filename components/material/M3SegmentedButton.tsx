'use client';

import React from 'react';
import '@material/web/labs/segmentedbutton/outlined-segmented-button.js';
import '@material/web/labs/segmentedbuttonset/outlined-segmented-button-set.js';
import '@material/web/icon/icon.js';

export interface SegmentedOption {
  label: string;
  icon?: string;
  value?: string;
}

export interface M3SegmentedButtonProps {
  /** Array of segment options */
  options: SegmentedOption[];
  /** Zero-based index of the currently selected segment */
  selectedIndex: number;
  /** Callback fired when a segment is clicked */
  onChange: (index: number) => void;
  /** Custom selected container color (e.g. '#004A76'). Defaults to theme if omitted */
  color?: string;
  /** Custom selected label/icon color. Defaults to theme if omitted */
  selectedTextColor?: string;
  className?: string;
  /** If true, removes the checkmark icon when selected to prevent layout shift */
  noCheckmark?: boolean;
}

export function M3SegmentedButton({
  options,
  selectedIndex,
  onChange,
  color,
  selectedTextColor,
  className = '',
  noCheckmark = false,
}: M3SegmentedButtonProps) {
  const customStyles: Record<string, string> = {};
  if (color) {
    customStyles['--md-outlined-segmented-button-selected-container-color'] = color;
  }
  if (selectedTextColor) {
    customStyles['--md-outlined-segmented-button-selected-label-text-color'] = selectedTextColor;
    customStyles['--md-outlined-segmented-button-selected-icon-color'] = selectedTextColor;
  }

  return (
    <div className={className} style={customStyles}>
      <md-outlined-segmented-button-set>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          return (
            <md-outlined-segmented-button
              key={index}
              label={option.label}
              selected={isSelected}
              no-checkmark={noCheckmark ? "" : undefined}
              ref={(el: HTMLElement | null) => {
                if (el) {
                  (el as unknown as { noCheckmark: boolean }).noCheckmark = Boolean(noCheckmark);
                }
              }}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => onChange(index)}
            >
              {option.icon && <md-icon slot="icon">{option.icon}</md-icon>}
            </md-outlined-segmented-button>
          );
        })}
      </md-outlined-segmented-button-set>
    </div>
  );
}

export default M3SegmentedButton;

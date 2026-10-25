'use client';

import React from 'react';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/labs/badge/badge.js';

export interface M3BadgeButtonProps {
  /** Icon name from Material Symbols (e.g. 'notifications', 'mail', 'shopping_cart') */
  icon: string;
  /** Badge text/number to display (e.g. 4, '99+'). If true, renders a dot badge. Omit for no badge */
  badgeValue?: string | number | boolean;
  /** Button style variant: standard, filled, filled-tonal, or outlined */
  variant?: 'standard' | 'filled' | 'filled-tonal' | 'outlined';
  /** Custom badge background color (e.g. '#FF5722'). Defaults to theme error/secondary if omitted */
  color?: string;
  /** Custom badge text color. Defaults to theme if omitted */
  badgeTextColor?: string;
  /** Click event handler */
  onClick?: () => void;
  className?: string;
}

export function M3BadgeButton({
  icon,
  badgeValue,
  variant = 'standard',
  color,
  badgeTextColor,
  onClick,
  className = '',
}: M3BadgeButtonProps) {
  const badgeStyles: Record<string, string> = {};
  if (color) {
    badgeStyles['--md-badge-color'] = color;
    badgeStyles['--md-badge-large-color'] = color;
  }
  if (badgeTextColor) {
    badgeStyles['--md-badge-label-text-color'] = badgeTextColor;
    badgeStyles['--md-badge-large-label-text-color'] = badgeTextColor;
  }

  const renderBadge = () => {
    if (badgeValue === undefined || badgeValue === false) return null;
    if (badgeValue === true || badgeValue === '') {
      return <md-badge style={badgeStyles}></md-badge>;
    }
    return <md-badge value={String(badgeValue)} style={badgeStyles}></md-badge>;
  };

  const renderButton = () => {
    switch (variant) {
      case 'filled':
        return (
          <md-filled-icon-button onClick={onClick}>
            <md-icon>{icon}</md-icon>
          </md-filled-icon-button>
        );
      case 'filled-tonal':
        return (
          <md-filled-tonal-icon-button onClick={onClick}>
            <md-icon>{icon}</md-icon>
          </md-filled-tonal-icon-button>
        );
      case 'outlined':
        return (
          <md-outlined-icon-button onClick={onClick}>
            <md-icon>{icon}</md-icon>
          </md-outlined-icon-button>
        );
      case 'standard':
      default:
        return (
          <md-icon-button onClick={onClick}>
            <md-icon>{icon}</md-icon>
          </md-icon-button>
        );
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {renderButton()}
      {renderBadge()}
    </div>
  );
}

export default M3BadgeButton;

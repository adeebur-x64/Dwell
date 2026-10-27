'use client';

import React from 'react';

export interface M3ButtonProps {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
  children: React.ReactNode;
  icon?: string;
  trailingIcon?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export function M3Button({
  variant = 'filled',
  children,
  icon,
  trailingIcon = false,
  disabled = false,
  onClick,
  className = '',
  style,
  type = 'button',
}: M3ButtonProps) {
  // Material 3 horizontal spacing specifications:
  // With leading icon: 16px start, 24px end
  // With trailing icon: 24px start, 16px end
  // Without icon: 24px start, 24px end
  // Text button: 12px start, 12px end
  let paddingClass = 'px-6';
  if (variant === 'text') {
    paddingClass = icon ? (trailingIcon ? 'pl-4 pr-3' : 'pl-3 pr-4') : 'px-3';
  } else if (icon) {
    paddingClass = trailingIcon ? 'pl-6 pr-4' : 'pl-4 pr-6';
  }

  // Material 3 Theme Variants matching Dwell's Ocean Blue design system
  const variantClasses = {
    filled:
      'bg-[#96CCFF] text-[#003353] hover:bg-[#B3D9FF] active:bg-[#CEE5FF] shadow-sm hover:shadow active:scale-[0.98]',
    tonal:
      'bg-[#3A4857] text-[#D5E4F6] hover:bg-[#485768] active:bg-[#546476] active:scale-[0.98]',
    outlined:
      'bg-transparent text-[#96CCFF] border border-[#8C9199] hover:bg-[#1A2129] active:bg-[#242C34] active:scale-[0.98]',
    elevated:
      'bg-[#1A2129] text-[#96CCFF] shadow-md hover:shadow-lg hover:bg-[#242C34] active:scale-[0.98]',
    text:
      'bg-transparent text-[#96CCFF] hover:bg-[#1A2129] active:bg-[#242C34]',
  };

  const iconElement = icon ? (
    <span
      className="material-symbols-outlined text-[18px] leading-none select-none transition-transform"
      aria-hidden="true"
    >
      {icon}
    </span>
  ) : null;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`inline-flex items-center justify-center gap-2 h-10 ${paddingClass} rounded-full text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-38 disabled:pointer-events-none disabled:shadow-none select-none focus-visible:outline-2 focus-visible:outline-[#96CCFF] focus-visible:outline-offset-2 ${variantClasses[variant]} ${className}`}
    >
      {!trailingIcon && iconElement}
      <span className="leading-none whitespace-nowrap">{children}</span>
      {trailingIcon && iconElement}
    </button>
  );
}

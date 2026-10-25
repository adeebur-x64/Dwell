import type { HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: `md-${string}`]: HTMLAttributes<HTMLElement> & Record<string, any>;
    }
  }

  namespace React.JSX {
    interface IntrinsicElements {
      [elemName: `md-${string}`]: HTMLAttributes<HTMLElement> & Record<string, any>;
    }
  }
}

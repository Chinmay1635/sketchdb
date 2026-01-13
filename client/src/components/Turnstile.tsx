import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const Turnstile: React.FC<TurnstileProps> = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    const loadScript = () => {
      if (document.querySelector('script[src*="turnstile"]')) {
        // Script already exists, render widget
        renderWidget();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;

      window.onTurnstileLoad = () => {
        renderWidget();
      };

      document.head.appendChild(script);
    };

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore errors when removing
        }
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme,
        size,
      });
    };

    // Check if turnstile is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      loadScript();
    }

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore errors when removing
        }
      }
    };
  }, [siteKey, onVerify, onError, onExpire, theme, size]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
};

export default Turnstile;

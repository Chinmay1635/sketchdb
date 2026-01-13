import React, { useEffect, useRef, useCallback } from 'react';

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
      getResponse: (widgetId: string) => string | undefined;
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
  const isRenderedRef = useRef(false);
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleVerify = useCallback((token: string) => {
    console.log('Turnstile verified, token received');
    onVerify(token);
  }, [onVerify]);
  
  const handleError = useCallback(() => {
    console.error('Turnstile error occurred');
    onError?.();
  }, [onError]);
  
  const handleExpire = useCallback(() => {
    console.log('Turnstile token expired');
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    let isMounted = true;
    
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || !isMounted) return;
      
      // Don't re-render if already rendered
      if (isRenderedRef.current && widgetIdRef.current) {
        return;
      }

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        // Render new widget
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'error-callback': handleError,
          'expired-callback': handleExpire,
          theme,
          size,
          retry: 'auto',
          'retry-interval': 8000,
        });
        isRenderedRef.current = true;
        console.log('Turnstile widget rendered');
      } catch (e) {
        console.error('Failed to render Turnstile widget:', e);
      }
    };

    const loadScript = () => {
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
      
      if (existingScript) {
        // Script exists, check if turnstile is ready
        if (window.turnstile) {
          renderWidget();
        } else {
          // Wait for script to load
          existingScript.addEventListener('load', renderWidget);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      
      script.onload = () => {
        if (isMounted) {
          renderWidget();
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        handleError();
      };

      document.head.appendChild(script);
    };

    // Check if turnstile is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      loadScript();
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
          isRenderedRef.current = false;
        } catch (e) {
          // Ignore errors when removing
        }
      }
    };
  }, [siteKey, handleVerify, handleError, handleExpire, theme, size]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
};

export default Turnstile;

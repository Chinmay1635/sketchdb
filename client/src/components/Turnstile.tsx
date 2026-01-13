import React, { useEffect, useRef, useCallback, useState } from 'react';

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
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');

  const handleVerify = useCallback((token: string) => {
    console.log('✅ Turnstile verified! Token length:', token.length);
    setStatus('verified');
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback((error?: any) => {
    console.error('❌ Turnstile error:', error);
    setStatus('error');
    onError?.();
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.log('⏰ Turnstile token expired');
    setStatus('ready');
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || !isMounted) {
        console.log('Cannot render: container or turnstile not ready');
        return;
      }

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore
        }
        widgetIdRef.current = null;
      }

      // Clear container
      containerRef.current.innerHTML = '';

      try {
        console.log('🔄 Rendering Turnstile widget with siteKey:', siteKey.substring(0, 10) + '...');
        
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'error-callback': (error: any) => {
            console.error('Turnstile error-callback:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying (${retryCount}/${maxRetries})...`);
              setTimeout(renderWidget, 2000);
            } else {
              handleError(error);
            }
          },
          'expired-callback': handleExpire,
          'timeout-callback': () => {
            console.log('Turnstile timeout');
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(renderWidget, 2000);
            }
          },
          theme,
          size,
          appearance: 'always',
          retry: 'auto',
          'retry-interval': 5000,
          'refresh-expired': 'auto',
        });
        
        setStatus('ready');
        console.log('✅ Turnstile widget rendered, widgetId:', widgetIdRef.current);
      } catch (e) {
        console.error('❌ Failed to render Turnstile widget:', e);
        handleError(e);
      }
    };

    const loadScript = () => {
      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');

      if (window.turnstile) {
        console.log('Turnstile already loaded, rendering...');
        renderWidget();
        return;
      }

      if (existingScript) {
        console.log('Script exists, waiting for load...');
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkTurnstile);
            renderWidget();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkTurnstile);
          if (!window.turnstile) {
            console.error('Turnstile failed to load after timeout');
            handleError();
          }
        }, 10000);
        return;
      }

      console.log('Loading Turnstile script...');
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;

      script.onload = () => {
        console.log('Turnstile script loaded');
        // Give it a moment to initialize
        setTimeout(() => {
          if (isMounted && window.turnstile) {
            renderWidget();
          }
        }, 100);
      };

      script.onerror = (e) => {
        console.error('Failed to load Turnstile script:', e);
        handleError();
      };

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [siteKey, handleVerify, handleError, handleExpire, theme, size]);

  return (
    <div className="turnstile-wrapper flex flex-col items-center my-4">
      <div ref={containerRef} />
      {status === 'loading' && (
        <div className="text-sm text-gray-500 mt-2">Loading verification...</div>
      )}
      {status === 'error' && (
        <div className="text-sm text-red-500 mt-2">
          Verification failed. Please refresh the page.
        </div>
      )}
      {status === 'verified' && (
        <div className="text-sm text-green-600 mt-2">✓ Verified</div>
      )}
    </div>
  );
};

export default Turnstile;

import React, { useEffect, useRef, useState } from 'react';

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
  const hasRenderedRef = useRef(false);
  const hasVerifiedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');

  // Store callbacks in refs to avoid re-render loops
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  // Update refs when props change
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    // Prevent multiple renders
    if (hasRenderedRef.current || hasVerifiedRef.current) {
      return;
    }

    let isMounted = true;
    let verificationTimeout: ReturnType<typeof setTimeout> | null = null;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || !isMounted) {
        return;
      }

      // Prevent duplicate renders
      if (hasRenderedRef.current) {
        return;
      }
      hasRenderedRef.current = true;

      // Set a timeout - if not verified in 30 seconds, show error
      verificationTimeout = setTimeout(() => {
        if (isMounted && !hasVerifiedRef.current) {
          console.log('⏱️ Turnstile verification timeout after 30s');
          setStatus('error');
        }
      }, 30000);

      try {
        console.log('🔄 Rendering Turnstile widget with siteKey:', siteKey.substring(0, 10) + '...');

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (hasVerifiedRef.current) return; // Prevent duplicate calls
            hasVerifiedRef.current = true;
            console.log('✅ Turnstile verified! Token length:', token.length);
            setStatus('verified');
            onVerifyRef.current(token);
          },
          'error-callback': () => {
            console.error('❌ Turnstile error');
            setStatus('error');
            onErrorRef.current?.();
          },
          'expired-callback': () => {
            console.log('⏰ Turnstile token expired');
            hasVerifiedRef.current = false;
            setStatus('ready');
            onExpireRef.current?.();
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
        setStatus('error');
      }
    };

    const loadScript = () => {
      if (window.turnstile) {
        renderWidget();
        return;
      }

      const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');

      if (existingScript) {
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkTurnstile);
            renderWidget();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkTurnstile);
          if (!window.turnstile && isMounted) {
            console.error('Turnstile failed to load');
            setStatus('error');
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
        setTimeout(() => {
          if (isMounted && window.turnstile) {
            renderWidget();
          }
        }, 100);
      };

      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        setStatus('error');
      };

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
      if (verificationTimeout) clearTimeout(verificationTimeout);
      // Don't remove widget on cleanup to prevent re-render issues
    };
  }, [siteKey, theme, size]); // Only re-run if these change

  const handleRetry = () => {
    hasRenderedRef.current = false;
    hasVerifiedRef.current = false;
    setStatus('loading');
    
    // Remove old widget and re-render
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setStatus('ready');
      } catch (e) {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="turnstile-wrapper flex flex-col items-center my-4">
      <div ref={containerRef} />
      {status === 'loading' && (
        <div className="text-sm text-gray-500 mt-2">Loading verification...</div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center mt-2">
          <div className="text-sm text-red-500">Verification failed or timed out.</div>
          <button
            onClick={handleRetry}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      )}
      {status === 'verified' && (
        <div className="text-sm text-green-600 mt-2">✓ Verified</div>
      )}
    </div>
  );
};

export default Turnstile;

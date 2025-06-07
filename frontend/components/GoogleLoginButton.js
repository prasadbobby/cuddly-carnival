'use client';
import { useEffect, useState } from 'react';
import { authService } from '../lib/auth';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';

const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function GoogleLoginButton({ onSuccess, onError, className = '', children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [buttonId] = useState(`google-btn-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Check if Google client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    console.log('🔑 Google Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT CONFIGURED');
    
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      if (onError) {
        onError(new Error('Google OAuth is not configured. Please check your environment variables.'));
      }
      return;
    }

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        if (window.google) {
          initializeGoogle();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => {
        console.error('❌ Failed to load Google Identity Services');
        if (onError) {
          onError(new Error('Failed to load Google services. Please check your internet connection.'));
        }
      };
      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      try {
        if (window.google && window.google.accounts) {
          console.log('🚀 Initializing Google OAuth...');
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });

          // Render the button
          setTimeout(() => {
            const buttonContainer = document.getElementById(buttonId);
            if (buttonContainer && window.google.accounts.id.renderButton) {
              window.google.accounts.id.renderButton(buttonContainer, {
                theme: 'outline',
                size: 'large',
                width: 350,
                type: 'standard',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
              });
            }
          }, 100);

          setIsGoogleReady(true);
          console.log('✅ Google OAuth initialized successfully');
        }
      } catch (error) {
        console.error('❌ Error initializing Google OAuth:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    loadGoogleScript();
  }, [buttonId, onError]);

  const handleGoogleResponse = async (response) => {
    try {
      setIsLoading(true);
      console.log('📥 Received Google credential response');
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
      
      const result = await authService.googleLogin(response.credential);
      console.log('✅ Google login successful:', result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomButtonClick = () => {
    if (!isGoogleReady) {
      if (onError) {
        onError(new Error('Google services not ready. Please refresh the page.'));
      }
      return;
    }

    try {
      console.log('🔐 Triggering Google login...');
      
      // Try to prompt the user
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('ℹ️ Google One Tap not displayed, user needs to click the button');
        }
      });
    } catch (error) {
      console.error('❌ Error triggering Google login:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Show the Google-rendered button if ready, otherwise show custom button
  return (
    <div className="w-full">
      {isGoogleReady ? (
        <div className="w-full">
          {/* Google's rendered button */}
          <div id={buttonId} className="w-full flex justify-center"></div>
          
          {/* Fallback custom button */}
          <div className="mt-2">
            <Button
              onClick={handleCustomButtonClick}
              disabled={isLoading}
              className={`w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 ${className}`}
              size="lg"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-3" />
              ) : (
                <GoogleIcon className="w-5 h-5 mr-3" />
              )}
              {isLoading ? 'Signing you in...' : (children || 'Continue with Google')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleCustomButtonClick}
          disabled={!isGoogleReady || isLoading}
          className={`w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 ${className}`}
          size="lg"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-3" />
          ) : (
            <GoogleIcon className="w-5 h-5 mr-3" />
          )}
          {isLoading ? 'Loading...' : (children || 'Continue with Google')}
        </Button>
      )}
      
      {!isGoogleReady && !isLoading && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Loading Google services...
        </p>
      )}
    </div>
  );
}
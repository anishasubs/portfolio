import { useState, useEffect, useRef } from "react";
import { Brain, LogIn, Sparkles, Calendar, Play, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { toast } from "sonner";
import { googleConfig } from "@/config/env";

interface WelcomePageProps {
  onLogin: (openaiKey: string, googleCredentials: string) => void;
}

export function WelcomePage({ onLogin }: WelcomePageProps) {
  const [googleCredentials, setGoogleCredentials] = useState("");
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Check if we just came back from OAuth redirect
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const error = hashParams.get("error");
    
    // Handle OAuth errors
    if (error) {
      const errorDescription = hashParams.get("error_description") || "Unknown error";
      console.error("OAuth Error:", error, errorDescription);
      
      toast.error("Google Calendar connection failed", {
        description: errorDescription.replace(/\+/g, ' '),
      });
      
      // Clean up the URL
      window.history.replaceState(null, "", window.location.pathname);
      setIsConnectingGoogle(false);
      return;
    }
    
    if (accessToken && window.location.hash.includes("access_token")) {
      const expiresIn = hashParams.get("expires_in");
      const state = hashParams.get("state");
      
      // Verify this is our OAuth callback
      if (state === "kaisey_calendar_auth") {
        const credentials = JSON.stringify({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: expiresIn,
          scope: hashParams.get("scope"),
          timestamp: Date.now()
        });
        
        localStorage.setItem("google_calendar_token", credentials);
        setGoogleCredentials(credentials);
        
        // Clean up the URL
        window.history.replaceState(null, "", window.location.pathname);
        
        toast.success("Google Calendar connected!", {
          description: "Your calendar is now synced with Kaisey.",
        });
        
        // Auto-login after connection
        setTimeout(() => {
          onLogin("", credentials);
        }, 1000);
      }
    }
    
    // Check if we already have credentials in localStorage
    const storedToken = localStorage.getItem("google_calendar_token");
    if (storedToken) {
      try {
        const parsed = JSON.parse(storedToken);
        // Check if token is not expired (add 1 hour buffer)
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < (Number(parsed.expires_in) * 1000 - 300000)) {
          setGoogleCredentials(storedToken);
          toast.success("Found existing Google Calendar connection", {
            description: "Logging you in...",
          });
          setTimeout(() => {
            onLogin("", storedToken);
          }, 1000);
        } else {
          // Token expired, clear it
          localStorage.removeItem("google_calendar_token");
        }
      } catch (e) {
        localStorage.removeItem("google_calendar_token");
      }
    }
  }, [onLogin]);

  const handleGoogleCalendarConnect = () => {
    setIsConnectingGoogle(true);
    
    // Get configuration from environment variables
    const CLIENT_ID = googleConfig.clientId;
    const SCOPES = googleConfig.scopes;
    const REDIRECT_URI = googleConfig.redirectUri;
    
    console.log("🔐 Google OAuth Configuration:");
    console.log("  Client ID:", CLIENT_ID ? `${CLIENT_ID.substring(0, 20)}...` : "❌ Not set");
    console.log("  Redirect URI:", REDIRECT_URI);
    console.log("  Scopes:", SCOPES);
    
    // Validation
    if (!CLIENT_ID || CLIENT_ID === "your-google-client-id-here.apps.googleusercontent.com") {
      toast.error("Google OAuth not configured", {
        description: "Please set VITE_GOOGLE_CLIENT_ID in your .env file or use Demo Mode",
      });
      setIsConnectingGoogle(false);
      return;
    }
    
    console.log("✅ Starting Google OAuth flow...");
    
    // IMPORTANT: Redirect directly in the same window instead of popup
    // This avoids cross-origin issues
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "token",
      scope: SCOPES,
      include_granted_scopes: "true",
      state: "kaisey_calendar_auth",
    })}`;
    
    console.log("🌐 Auth URL generated, redirecting...");
    
    // Save that we're in the middle of auth
    sessionStorage.setItem("kaisey_auth_in_progress", "true");
    
    // Show a toast to indicate we're redirecting
    toast.info("Redirecting to Google...", {
      description: "You'll be redirected to sign in with Google Calendar.",
    });
    
    // Small delay to ensure state is saved and toast is shown
    setTimeout(() => {
      console.log("🚀 Redirecting to Google OAuth...");
      window.location.href = authUrl;
    }, 500);
  };

  const handleLogin = () => {
    if (googleCredentials) {
      onLogin("", googleCredentials);
    } else {
      toast.error("Please connect your Google Calendar first.");
    }
  };

  const handleDemoMode = () => {
    // Create a demo token for testing
    const demoCredentials = JSON.stringify({
      access_token: "demo_token",
      token_type: "Bearer",
      expires_in: "3600",
      scope: "demo",
      timestamp: Date.now(),
      isDemo: true
    });
    
    localStorage.setItem("google_calendar_token", demoCredentials);
    
    toast.success("Demo Mode Activated!", {
      description: "You're using Kaisey with sample data. Connect Google Calendar later in Settings.",
    });
    
    onLogin("", demoCredentials);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const handleSkipVideo = () => {
    setShowVideo(false);
  };

  // Video intro view
  if (showVideo && !videoError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          {!videoReady && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-4" />
              <p className="text-white/60 text-sm">Loading demo...</p>
            </div>
          )}
          <video
            ref={videoRef}
            src={`${import.meta.env.BASE_URL}kaisey-demo.mp4`}
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onEnded={handleSkipVideo}
            onError={() => { setVideoError(true); setShowVideo(false); }}
            className={`w-full rounded-2xl shadow-2xl ${videoReady ? '' : 'hidden'}`}
          />
          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/portfolio/"
              className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </a>
            <button
              onClick={handleSkipVideo}
              className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium backdrop-blur-sm transition-colors"
            >
              Skip to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Kaisey</h1>
          <p className="text-muted-foreground">
            Your AI-powered MBA Co-Pilot for Academic Excellence, Professional Networking, and Personal Well-being
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-semibold">AI Insights</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-xs font-semibold">Smart Scheduling</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <LogIn className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs font-semibold">Integrations</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Connect Your Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Get started by connecting your Google Calendar to Kaisey
              </p>
            </div>
            
            {!googleCredentials ? (
              <Button
                onClick={handleGoogleCalendarConnect}
                disabled={isConnectingGoogle}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {isConnectingGoogle ? "Connecting..." : "Connect my Google Calendar"}
              </Button>
            ) : (
              <div className="p-6 rounded-lg border-2 border-green-500/20 bg-green-50 dark:bg-green-900/10 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-lg font-semibold">Google Calendar Connected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to Kaisey...
                </p>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Try Demo Mode</h2>
              <p className="text-sm text-muted-foreground">
                Experience Kaisey with sample data
              </p>
            </div>
            
            <Button
              onClick={handleDemoMode}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Activate Demo Mode
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Kaisey integrates with Canvas/LMS, Google Calendar, Apple Health, Strava, and Whoop to optimize your MBA experience.
          </p>
          <a
            href="/portfolio/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Portfolio
          </a>
        </div>
      </Card>
    </div>
  );
}
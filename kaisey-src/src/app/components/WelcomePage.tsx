import { useState, useEffect, useRef } from "react";
import { Sparkles, Calendar, Play, ArrowLeft, Activity } from "lucide-react";
import { KaiseyMark } from "@/app/components/KaiseyLogo";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { toast } from "sonner";
import { googleConfig } from "@/config/env";

interface WelcomePageProps {
  onLogin: (googleCredentials: string) => void;
}

export function WelcomePage({ onLogin }: WelcomePageProps) {
  const [googleCredentials, setGoogleCredentials] = useState("");
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Check if we just came back from OAuth redirect
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const error = hashParams.get("error");
    
    // Handle OAuth errors (only for Google, not Oura)
    const state = hashParams.get("state");
    if (error && state === "kaisey_calendar_auth") {
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
          onLogin(credentials);
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
            onLogin(storedToken);
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
    
    onLogin(demoCredentials);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  // The intro is light (renders #FAFAFC) until it cuts to the dark logo end
  // card (#0E0E12) at ~14.8s.
  // The page follows it, so the 16:9 frame never shows as a box.
  const [videoDark, setVideoDark] = useState(false);
  useEffect(() => {
    if (!showVideo) return;
    let id = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) setVideoDark(v.currentTime >= 14.8);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [showVideo]);
  const handleSkipVideo = () => {
    setShowVideo(false);
  };

  // Video intro view
  if (showVideo && !videoError) {
    // One 16:9 intro (a cut of the Time Blocks demo) for every screen. On a
    // phone it spans the full width rather than a narrow portrait column.
    const videoSrc = `${import.meta.env.BASE_URL}kaisey-instruction.mp4`;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-8 ${videoDark ? 'bg-[#0E0E12]' : 'bg-[#FAFAFC]'}`}>
        <div className="w-full max-w-5xl">
          {!videoReady && (
            <div className="flex flex-col items-center justify-center py-20">
              <KaiseyMark size={56} className="mb-4" motion="shuffle" />
              <p className="text-[#5D5D6B] text-sm">Loading demo...</p>
            </div>
          )}
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onEnded={handleSkipVideo}
            onError={() => { setVideoError(true); setShowVideo(false); }}
            className={`w-full ${videoReady ? '' : 'hidden'}`}
          />
          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/portfolio/"
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${videoDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#0E0E12]/[0.06] hover:bg-[#0E0E12]/10 text-[#0E0E12]'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </a>
            <button
              onClick={handleSkipVideo}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${videoDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#0E0E12] hover:bg-[#25252D] text-white'}`}
            >
              Skip to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const blocks = ["bg-blue-500 w-[72px]", "bg-red-500 w-10", "bg-orange-500 w-14", "bg-green-500 w-8"];

  return (
    <div className="min-h-screen bg-[#FAFAFC] grid lg:grid-cols-[minmax(0,640px)_1fr]">
      {/* Brand panel */}
      <aside className="bg-[#0E0E12] text-[#FAFAFC] px-6 py-8 sm:px-10 lg:p-16 flex flex-col justify-between gap-10">
        <div className="flex items-center gap-3">
          <KaiseyMark size={36} />
          <span className="text-xl font-semibold" style={{ letterSpacing: "-0.04em" }}>Kaisey</span>
        </div>
        <div className="space-y-7">
          <div className="flex gap-2.5" aria-hidden="true">
            {blocks.map((b) => (
              <span key={b} className={`h-10 rounded-lg ${b}`} />
            ))}
          </div>
          <h1
            className="text-4xl lg:text-[46px] font-semibold leading-[1.04] text-[#FAFAFC]"
            style={{ letterSpacing: "-0.045em" }}
          >
            Tell Kaisey what matters.
            <br />
            Your week follows.
          </h1>
          <p className="text-base lg:text-lg leading-relaxed text-[#FAFAFC]/70 max-w-md">
            An AI co-pilot for students that balances academics, recruiting, social life and wellness across the calendar you already use.
          </p>
        </div>
        <a
          href="/portfolio/"
          className="inline-flex items-center gap-2 font-mono text-xs text-[#FAFAFC]/55 hover:text-[#FAFAFC] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          back to portfolio
        </a>
      </aside>

      {/* Sign in */}
      <main className="flex items-center justify-center px-5 py-10 lg:p-12">
        <Card className="w-full max-w-[460px] p-8 lg:p-10 gap-0 shadow-sm">
          <KaiseyMark size={56} className="mb-4" motion="assemble" />
          <h2 className="text-3xl font-semibold mb-2" style={{ letterSpacing: "-0.04em" }}>Welcome to Kaisey</h2>
          <p className="text-muted-foreground mb-7">
            Connect your Google Calendar and Kaisey starts with the week you already have.
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-7">
            {[
              { Icon: Sparkles, label: "AI insights" },
              { Icon: Calendar, label: "Smart scheduling" },
              { Icon: Activity, label: "Oura sync" },
            ].map(({ Icon, label }) => (
              <div key={label} className="rounded-xl bg-brand/10 p-3.5 flex flex-col gap-2">
                <Icon className="w-4 h-4 text-brand" aria-hidden="true" />
                <span className="text-[13px] font-semibold leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {!googleCredentials ? (
              <Button
                onClick={handleGoogleCalendarConnect}
                disabled={isConnectingGoogle}
                className="w-full h-13 bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                {isConnectingGoogle ? "Connecting..." : "Connect my Google Calendar"}
              </Button>
            ) : (
              <div className="p-5 rounded-xl border text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold">Google Calendar connected</span>
                </div>
                <p className="text-sm text-muted-foreground">Taking you to Kaisey&hellip;</p>
              </div>
            )}

            <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground" aria-hidden="true">
              <span className="flex-1 h-px bg-border" />
              or
              <span className="flex-1 h-px bg-border" />
            </div>

            <Button onClick={handleDemoMode} variant="outline" className="w-full h-13" size="lg">
              Try demo mode
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Calendar data is processed in your session and never stored on a server. Oura Ring sync is optional.
          </p>
        </Card>
      </main>
    </div>
  );
}
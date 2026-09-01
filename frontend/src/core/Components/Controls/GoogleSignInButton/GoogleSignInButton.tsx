import { useEffect, useRef } from "react";

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      const width = Math.min(
        Math.round(containerRef.current.getBoundingClientRect().width) || 300,
        400,
      );
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width,
      });
    };

    if (window.google) {
      render();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          render();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  if (!CLIENT_ID) {
    return null;
  }

  return <div ref={containerRef} style={{ width: "100%" }} />;
}

export default GoogleSignInButton;

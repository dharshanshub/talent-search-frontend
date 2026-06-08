import { useState } from "react";
import { loginUser } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const token = await loginUser(username.trim(), password);
      login(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <div className="login-logo">
          <LogoMark />
        </div>
        <div className="login-title">TalentAI</div>
        <div className="login-sub">Sign in to your workspace</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              className="login-input"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading || !username.trim() || !password}>
            {loading ? <span className="login-spinner" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="white" strokeWidth="1.4" strokeOpacity=".65" fill="none"/>
      <circle cx="12" cy="12" r="2.8" fill="white"/>
      <line x1="12" y1="9.1" x2="12" y2="4" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <line x1="14.4" y1="10.55" x2="19.4" y2="7.65" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <line x1="14.4" y1="13.45" x2="19.4" y2="16.35" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <line x1="12" y1="14.9" x2="12" y2="20" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <line x1="9.6" y1="13.45" x2="4.6" y2="16.35" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <line x1="9.6" y1="10.55" x2="4.6" y2="7.65" stroke="white" strokeWidth="1.1" strokeOpacity=".8"/>
      <circle cx="12" cy="3.5" r="1.6" fill="white" fillOpacity=".95"/>
      <circle cx="20" cy="7.8" r="1.6" fill="white" fillOpacity=".95"/>
      <circle cx="20" cy="16.2" r="1.6" fill="white" fillOpacity=".95"/>
      <circle cx="12" cy="20.5" r="1.6" fill="white" fillOpacity=".95"/>
      <circle cx="4" cy="16.2" r="1.6" fill="white" fillOpacity=".95"/>
      <circle cx="4" cy="7.8" r="1.6" fill="white" fillOpacity=".95"/>
    </svg>
  );
}

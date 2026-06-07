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
    <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 7v6l7 5 7-5V7L10 2z" fill="white" fillOpacity=".95" />
      <path d="M10 2v14M3 7l7 3 7-3" stroke="white" strokeWidth="1.2" strokeOpacity=".45" />
    </svg>
  );
}

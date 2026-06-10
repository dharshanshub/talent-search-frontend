import { useState } from "react";
import { loginUser } from "../api/client";
import { useAuth } from "../context/AuthContext";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GradientLogoMark() {
  return (
    <svg width="42" height="42" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="loginBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="52%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#loginBrandGrad)">
        <path d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z" strokeWidth="1.9" strokeLinejoin="round" strokeOpacity="0.9" />
        <g strokeWidth="1.4" strokeOpacity="0.8">
          <line x1="16" y1="16" x2="16" y2="4.6" />
          <line x1="16" y1="16" x2="25.6" y2="10.3" />
          <line x1="16" y1="16" x2="25.6" y2="21.7" />
          <line x1="16" y1="16" x2="16" y2="27.4" />
          <line x1="16" y1="16" x2="6.4" y2="21.7" />
          <line x1="16" y1="16" x2="6.4" y2="10.3" />
        </g>
      </g>
      <g fill="url(#loginBrandGrad)">
        <circle cx="16" cy="16" r="3.4" />
        <circle cx="16" cy="4.6" r="2" />
        <circle cx="25.6" cy="10.3" r="2" />
        <circle cx="25.6" cy="21.7" r="2" />
        <circle cx="16" cy="27.4" r="2" />
        <circle cx="6.4" cy="21.7" r="2" />
        <circle cx="6.4" cy="10.3" r="2" />
      </g>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" />
    </svg>
  );
}

function SearchHeroIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-split">

      {/* ── Left hero panel ───────────────────────────────────────────────── */}
      <div className="login-hero">
        <div className="login-hero-logo"><LogoMark /></div>
        <div className="login-hero-eyebrow">AI-Powered Recruitment Platform</div>
        <div className="login-hero-title">Find the right<br />talent,<br />right now.</div>
        <div className="login-hero-sub">
          TalentAI uses semantic search and generative AI to instantly surface
          your best-fit candidates — no more keyword hunting, no more wasted hours.
        </div>
        <div className="login-hero-features">
          <div className="login-hero-feature">
            <div className="login-hero-feature-icon" style={{ color: "#22d3ee" }}><SearchHeroIcon /></div>
            <span className="login-hero-feature-text"><strong>Semantic search</strong> across your entire talent pool</span>
          </div>
          <div className="login-hero-feature">
            <div className="login-hero-feature-icon" style={{ color: "#a78bfa" }}><BrainIcon /></div>
            <span className="login-hero-feature-text"><strong>AI-ranked results</strong> with instant candidate insights</span>
          </div>
          <div className="login-hero-feature">
            <div className="login-hero-feature-icon" style={{ color: "#f472b6" }}><DocIcon /></div>
            <span className="login-hero-feature-text"><strong>Resume screening</strong> powered by GPT-4o</span>
          </div>
        </div>
        <div className="login-hero-stat-row">
          <div className="login-hero-stat">
            <div className="login-hero-stat-num">10x</div>
            <div className="login-hero-stat-label">Faster Hiring</div>
          </div>
          <div className="login-hero-stat">
            <div className="login-hero-stat-num">95%</div>
            <div className="login-hero-stat-label">Match Accuracy</div>
          </div>
          <div className="login-hero-stat">
            <div className="login-hero-stat-num">GPT-4o</div>
            <div className="login-hero-stat-label">Powered</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-panel-inner">

          {/* brand lockup */}
          <div className="login-brandbar">
            <div className="login-brandbar-logo"><GradientLogoMark /></div>
            <div className="login-brandbar-name">TalentAI</div>
          </div>

          <div className="login-card">
            <div className="login-eyebrow-pill">
              <span className="login-eyebrow-dot" /> Secure workspace sign-in
            </div>
            <div className="login-title">Welcome back</div>
            <div className="login-sub">Sign in to your TalentAI workspace</div>

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
              <div className="login-pw-wrap">
                <input
                  className="login-input login-input-pw"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              className="login-btn"
              type="submit"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? <span className="login-spinner" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          </div>

          {/* trust footer */}
          <div className="login-footer">
            <div className="login-footer-pills">
              <span className="login-foot-pill"><LockIcon /> Encrypted</span>
              <span className="login-foot-pill"><BoltIcon /> AI-Powered</span>
              <span className="login-foot-pill">GPT-4o</span>
            </div>
            <div className="login-footer-copy">© 2026 TalentAI · Intelligent candidate search</div>
          </div>

        </div>
      </div>

    </div>
  );
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
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

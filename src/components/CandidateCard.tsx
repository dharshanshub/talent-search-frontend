import type { CandidateMatch } from "../api/client";

interface Props {
  candidate: CandidateMatch;
  rank: number;
  onViewResume: (c: CandidateMatch) => void;
}

// Deterministic avatar background based on name
const AVATAR_BG = [
  "#4f46e5", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#db2777", "#2563eb",
];
const avatarBg = (name: string) => AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];

// Skill chip colour palette (dark theme)
const CHIP_STYLES = [
  { bg: "rgba(99,102,241,0.14)",  border: "rgba(99,102,241,0.3)",  color: "#a5b4fc" },
  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)", color: "#6ee7b7" },
  { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.28)", color: "#fcd34d" },
  { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.3)", color: "#c4b5fd" },
  { bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.28)", color: "#67e8f9" },
  { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)", color: "#fca5a5" },
  { bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.28)", color: "#5eead4" },
];
const chipStyle = (i: number) => CHIP_STYLES[i % CHIP_STYLES.length];

// Score → colour scheme (dark theme)
function scoreScheme(score: number) {
  if (score >= 0.82) return { stripe: "#34d399", pill: { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  color: "#6ee7b7" } };
  if (score >= 0.68) return { stripe: "#fbbf24", pill: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  color: "#fcd34d" } };
  return                     { stripe: "#818cf8", pill: { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.3)", color: "#c4b5fd" } };
}

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const relTime = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export function CandidateCard({ candidate, rank, onViewResume }: Props) {
  const pct = Math.round(candidate.score * 100);
  const { stripe, pill } = scoreScheme(candidate.score);

  return (
    <div className="c-card" style={{ animationDelay: `${Math.min(rank - 1, 8) * 60}ms` }}>
      <div className="c-stripe" style={{ background: stripe, color: stripe }} />
      <div className="c-body">

        {/* top row */}
        <div className="c-top">
          <div className="c-avatar" style={{ background: avatarBg(candidate.name) }}>
            {initials(candidate.name)}
          </div>

          <div className="c-info">
            <div className="c-name">
              <span className="c-rank">#{rank}</span>
              {candidate.name}
            </div>
            <div className="c-title">{candidate.title}</div>
          </div>

          <div
            className="c-score-pill"
            style={{ background: pill.bg, borderColor: pill.border, color: pill.color }}
          >
            {pct}% match
          </div>
        </div>

        {/* meta */}
        <div className="c-meta">
          <div className="c-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "rgba(221,230,255,0.35)" }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {candidate.location}
          </div>
          <div className="c-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "rgba(221,230,255,0.35)" }}>
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            {candidate.years_experience} yrs experience
          </div>
          <div className="c-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "rgba(221,230,255,0.35)" }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span title={fmtDate(candidate.last_updated)}>{relTime(candidate.last_updated)}</span>
          </div>
        </div>

        {/* skills */}
        <div className="c-skills">
          {candidate.skills.slice(0, 9).map((skill, i) => {
            const s = chipStyle(i);
            return (
              <span key={skill} className="c-chip" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                {skill}
              </span>
            );
          })}
          {candidate.skills.length > 9 && (
            <span className="c-chip" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(221,230,255,0.4)" }}>
              +{candidate.skills.length - 9}
            </span>
          )}
        </div>

        {/* footer */}
        <div className="c-footer">
          <div className="c-updated">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Updated {fmtDate(candidate.last_updated)}
          </div>
          <div className="c-footer-right">
            <div className="c-exp-badge">{candidate.years_experience} yrs exp</div>
            {candidate.blob_filename && (
              <button className="c-resume-btn" onClick={() => onViewResume(candidate)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                View Resume
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

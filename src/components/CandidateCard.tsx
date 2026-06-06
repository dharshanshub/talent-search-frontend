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

// Skill chip colour palette (light bg + matching border + text)
const CHIP_STYLES = [
  { bg: "#eef2ff", border: "#c7d2fe", color: "#4338ca" },
  { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
  { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
  { bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce" },
  { bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1" },
  { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
  { bg: "#f0fdfa", border: "#99f6e4", color: "#0f766e" },
];
const chipStyle = (i: number) => CHIP_STYLES[i % CHIP_STYLES.length];

// Score → colour scheme
function scoreScheme(score: number) {
  if (score >= 0.82) return { stripe: "#059669", pill: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" } };
  if (score >= 0.68) return { stripe: "#d97706", pill: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" } };
  return { stripe: "#6366f1", pill: { bg: "#eef2ff", border: "#c7d2fe", color: "#3730a3" } };
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
    <div className="c-card">
      <div className="c-stripe" style={{ background: stripe }} />
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#94a3b8" }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {candidate.location}
          </div>
          <div className="c-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#94a3b8" }}>
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            {candidate.years_experience} yrs experience
          </div>
          <div className="c-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#94a3b8" }}>
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
            <span className="c-chip" style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }}>
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
            <button className="c-resume-btn" onClick={() => onViewResume(candidate)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              View Resume
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

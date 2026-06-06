import type { CandidateMatch } from "../api/client";

interface Props {
  candidate: CandidateMatch;
  onClose: () => void;
}

const AVATAR_BG = [
  "#4f46e5", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#db2777", "#2563eb",
];
const avatarBg = (name: string) => AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];
const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function scoreScheme(score: number) {
  if (score >= 0.82) return { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46", label: "Excellent" };
  if (score >= 0.68) return { bg: "#fffbeb", border: "#fde68a", color: "#92400e", label: "Good" };
  return { bg: "#eef2ff", border: "#c7d2fe", color: "#3730a3", label: "Fair" };
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function ResumeDrawer({ candidate, onClose }: Props) {
  const pct = Math.round(candidate.score * 100);
  const scheme = scoreScheme(candidate.score);
  const resumeUrl = `/api/v1/candidates/${candidate.id}/resume`;
  const downloadUrl = `${resumeUrl}?dl=1`;

  return (
    <>
      {/* backdrop */}
      <div className="rd-overlay" onClick={onClose} />

      {/* drawer panel */}
      <div className="rd-panel">

        {/* ── Header ─────────────────────────────── */}
        <div className="rd-header">
          <div className="rd-header-stripe" />

          <div className="rd-header-body">
            {/* avatar + name */}
            <div className="rd-candidate-row">
              <div className="rd-avatar" style={{ background: avatarBg(candidate.name) }}>
                {initials(candidate.name)}
              </div>
              <div className="rd-candidate-info">
                <div className="rd-candidate-name">{candidate.name}</div>
                <div className="rd-candidate-title">{candidate.title}</div>
                <div className="rd-candidate-meta">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {candidate.location}
                  <span className="rd-meta-dot" />
                  {candidate.years_experience} yrs experience
                </div>
              </div>
              <div
                className="rd-score-pill"
                style={{ background: scheme.bg, borderColor: scheme.border, color: scheme.color }}
              >
                {pct}%
                <span className="rd-score-label">{scheme.label}</span>
              </div>
            </div>

            {/* actions row */}
            <div className="rd-actions">
              <div className="rd-file-badge">
                <FileIcon />
                {candidate.id}_resume.pdf
              </div>
              <div className="rd-btn-group">
                <a
                  className="rd-btn rd-btn-download"
                  href={downloadUrl}
                  download={`${candidate.name.replace(/ /g, "_")}_resume.pdf`}
                >
                  <DownloadIcon />
                  Download PDF
                </a>
                <button className="rd-btn rd-btn-close" onClick={onClose}>
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── PDF viewer ──────────────────────────── */}
        <div className="rd-body">
          <iframe
            className="rd-iframe"
            src={resumeUrl}
            title={`${candidate.name} Resume`}
          />
        </div>

      </div>
    </>
  );
}

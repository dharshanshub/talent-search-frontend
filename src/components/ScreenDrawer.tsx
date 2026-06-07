import { useRef, useState } from "react";
import type { ExtractedProfile, Seniority } from "../api/client";
import { uploadResume, indexCandidate } from "../api/client";

interface Props { onClose: () => void; }

type Step = "upload" | "extracting" | "review" | "done";

const SENIORITIES: Seniority[] = ["Junior", "Mid-Level", "Senior", "Staff", "Principal"];

// ── icons ─────────────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function UploadCloudIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function PlusSmIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function XSmIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── tag-input helper ──────────────────────────────────────────────────────────
function TagInput({ tags, onChange, placeholder, colorClass }: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
  colorClass: string;
}) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal("");
  };
  return (
    <div className="sc-tag-wrap">
      {tags.map((t) => (
        <span key={t} className={`sc-tag ${colorClass}`}>
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))}><XSmIcon /></button>
        </span>
      ))}
      <div className="sc-tag-input-row">
        <input
          className="sc-tag-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button className="sc-tag-add" onClick={add}><PlusSmIcon /></button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function ScreenDrawer({ onClose }: Props) {
  const [step, setStep]               = useState<Step>("upload");
  const [dragging, setDragging]       = useState(false);
  const [fileName, setFileName]       = useState("");
  const [error, setError]             = useState("");
  const [rawText, setRawText]         = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [blobFilename, setBlobFilename] = useState("");
  const [profile, setProfile]         = useState<ExtractedProfile | null>(null);
  const [indexing, setIndexing]       = useState(false);
  const [result, setResult]           = useState<{ candidate_id: string; chunks: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) { setError("Only PDF files are supported"); return; }
    setError("");
    setFileName(file.name);
    setStep("extracting");
    try {
      const res = await uploadResume(file);
      setCandidateId(res.candidate_id);
      setBlobFilename(res.blob_filename);
      setProfile(res.extracted);
      setRawText(res.raw_text);
      setStep("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Extraction failed");
      setStep("upload");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleIndex = async () => {
    if (!profile) return;
    setIndexing(true);
    try {
      const res = await indexCandidate(candidateId, blobFilename, profile, rawText);
      setResult({ candidate_id: res.candidate_id, chunks: res.chunks_indexed });
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Indexing failed");
    } finally {
      setIndexing(false);
    }
  };

  const set = <K extends keyof ExtractedProfile>(k: K, v: ExtractedProfile[K]) =>
    setProfile((p) => p ? { ...p, [k]: v } : p);

  return (
    <>
      <div className="rd-overlay" onClick={onClose} />
      <div className="rd-panel sc-panel">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="sc-header">
          <div className="sc-header-stripe" />
          <div className="sc-header-body">
            <div className="sc-header-left">
              <div className="sc-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <div className="sc-header-title">Resume Screening</div>
                <div className="sc-header-sub">AI-powered candidate extraction</div>
              </div>
            </div>
            <button className="sc-close-btn" onClick={onClose}><CloseIcon /></button>
          </div>

          {/* step progress */}
          <div className="sc-steps">
            {(["upload","extracting","review","done"] as Step[]).map((s, i) => {
              const labels = ["Upload", "Extracting", "Review", "Indexed"];
              const idx = ["upload","extracting","review","done"].indexOf(step);
              const done = i < idx;
              const active = s === step;
              return (
                <div key={s} className="sc-step-item">
                  <div className={`sc-step-dot ${active ? "active" : ""} ${done ? "done" : ""}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`sc-step-label ${active ? "active" : ""}`}>{labels[i]}</span>
                  {i < 3 && <div className={`sc-step-line ${done ? "done" : ""}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────── */}
        <div className="sc-body">

          {/* STEP 1 — upload */}
          {step === "upload" && (
            <div className="sc-upload-step">
              <div
                className={`sc-drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div className="sc-drop-icon"><UploadCloudIcon /></div>
                <div className="sc-drop-title">Drop your resume here</div>
                <div className="sc-drop-sub">or <span className="sc-drop-link">click to browse</span></div>
                <div className="sc-drop-hint">PDF only · max 10 MB</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
              {error && <div className="sc-error">{error}</div>}
            </div>
          )}

          {/* STEP 2 — extracting */}
          {step === "extracting" && (
            <div className="sc-extracting-step">
              <div className="sc-extract-animation">
                <div className="sc-extract-ring" />
                <div className="sc-extract-ring sc-extract-ring-2" />
                <div className="sc-extract-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.6">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
              <div className="sc-extract-title">Analyzing resume with AI</div>
              <div className="sc-extract-file">{fileName}</div>
              <div className="sc-extract-steps">
                {["Parsing PDF text", "Extracting candidate info", "Preparing for review"].map((label, i) => (
                  <div key={label} className="sc-ext-row">
                    <div className="sc-ext-spinner" style={{ animationDelay: `${i * 0.4}s` }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — review */}
          {step === "review" && profile && (
            <div className="sc-review-step">
              <div className="sc-review-banner">
                <div className="sc-review-avatar" style={{ background: "#4f46e5" }}>
                  {profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <div className="sc-review-name">{profile.name}</div>
                  <div className="sc-review-title-text">{profile.title}</div>
                </div>
                <div className="sc-review-ai-badge">AI Extracted</div>
              </div>

              <div className="sc-section-label">Personal Information</div>
              <div className="sc-field-grid">
                <div className="sc-field">
                  <label>Full Name</label>
                  <input value={profile.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="sc-field">
                  <label>Job Title</label>
                  <input value={profile.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="sc-field">
                  <label>Location</label>
                  <input value={profile.location} onChange={(e) => set("location", e.target.value)} />
                </div>
                <div className="sc-field">
                  <label>Years of Experience</label>
                  <input type="number" min={0} max={50}
                    value={profile.years_experience}
                    onChange={(e) => set("years_experience", parseInt(e.target.value) || 0)} />
                </div>
                <div className="sc-field">
                  <label>Seniority</label>
                  <select value={profile.seniority} onChange={(e) => set("seniority", e.target.value as Seniority)}>
                    {SENIORITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sc-field">
                  <label>Role</label>
                  <input value={profile.role} onChange={(e) => set("role", e.target.value)} />
                </div>
              </div>

              <div className="sc-section-label">Skills</div>
              <TagInput tags={profile.skills} onChange={(t) => set("skills", t)}
                placeholder="Add skill…" colorClass="sc-tag-indigo" />

              <div className="sc-section-label">Industries</div>
              <TagInput tags={profile.industries} onChange={(t) => set("industries", t)}
                placeholder="Add industry…" colorClass="sc-tag-violet" />

              <div className="sc-section-label">Professional Summary</div>
              <textarea className="sc-summary"
                value={profile.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={4}
              />

              {error && <div className="sc-error">{error}</div>}

              <button className="sc-index-btn" onClick={handleIndex} disabled={indexing}>
                {indexing ? (
                  <><div className="sc-btn-spinner" /> Indexing…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Looks good — Index Candidate
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 4 — done */}
          {step === "done" && result && profile && (
            <div className="sc-done-step">
              <div className="sc-done-icon"><CheckCircleIcon /></div>
              <div className="sc-done-title">Candidate Indexed!</div>
              <div className="sc-done-name">{profile.name}</div>
              <div className="sc-done-title-text">{profile.title}</div>
              <div className="sc-done-meta">
                <span>{result.chunks} text chunks embedded</span>
                <span>·</span>
                <span>Now searchable in TalentAI</span>
              </div>
              <div className="sc-done-id">ID: {result.candidate_id}</div>
              <div className="sc-done-actions">
                <button className="sc-index-btn" onClick={() => {
                  setStep("upload"); setProfile(null); setRawText(""); setFileName("");
                  setResult(null); setCandidateId(""); setBlobFilename("");
                }}>
                  Screen Another Resume
                </button>
                <button className="sc-ghost-btn" onClick={onClose}>Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

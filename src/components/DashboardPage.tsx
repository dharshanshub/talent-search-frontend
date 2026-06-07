import { useEffect, useState } from "react";
import {
  listKnowledgeBase,
  deleteCandidate,
  type CandidateRecord,
  type KnowledgeBaseStats,
} from "../api/client";

type SortCol = "name" | "title" | "seniority" | "location" | "years_experience" | "indexed_at";
type SortDir = "asc" | "desc";

const SENIORITY_ORDER: Record<string, number> = {
  Junior: 0, "Mid-Level": 1, Senior: 2, Staff: 3, Principal: 4,
};

const SENIORITY_COLORS: Record<string, string> = {
  Junior: "#10b981",
  "Mid-Level": "#3b82f6",
  Senior: "#6366f1",
  Staff: "#8b5cf6",
  Principal: "#ec4899",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function SortArrow({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (col !== active) return <span className="sort-arrow inactive">↕</span>;
  return <span className="sort-arrow active">{dir === "asc" ? "↑" : "↓"}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-label">{label}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </div>
  );
}

function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Remove candidate</div>
        <div className="modal-body">
          Remove <strong>{name}</strong> from the knowledge base? This deletes all indexed data
          and the source PDF from storage. This cannot be undone.
        </div>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="modal-btn-delete" onClick={onConfirm} disabled={loading}>
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortCol, setSortCol] = useState<SortCol>("indexed_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterText, setFilterText] = useState("");
  const [filterSeniority, setFilterSeniority] = useState("All");

  const [deleteTarget, setDeleteTarget] = useState<CandidateRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listKnowledgeBase();
      setRecords(data.candidates);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCandidate(deleteTarget.candidate_id);
      setRecords((prev) => prev.filter((r) => r.candidate_id !== deleteTarget.candidate_id));
      setStats((prev) => prev ? { ...prev, total_profiles: prev.total_profiles - 1 } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Filtered + sorted rows ────────────────────────────────────────────────
  const filtered = records
    .filter((r) => {
      const txt = filterText.toLowerCase();
      if (txt && !r.name.toLowerCase().includes(txt) && !r.title.toLowerCase().includes(txt)) return false;
      if (filterSeniority !== "All" && r.seniority !== filterSeniority) return false;
      return true;
    })
    .sort((a, b) => {
      let av: string | number = a[sortCol];
      let bv: string | number = b[sortCol];
      if (sortCol === "seniority") {
        av = SENIORITY_ORDER[av as string] ?? 99;
        bv = SENIORITY_ORDER[bv as string] ?? 99;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const seniorityOptions = ["All", "Junior", "Mid-Level", "Senior", "Staff", "Principal"];

  return (
    <div className="dash-pane">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-title">Knowledge Base</div>
          <div className="dash-header-sub">Manage your indexed talent pool</div>
        </div>
        <button className="dash-refresh-btn" onClick={load} disabled={loading} title="Refresh">
          <RefreshIcon spinning={loading} />
          Refresh
        </button>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {stats && (
        <div className="dash-stats-row">
          <StatCard
            label="Profiles in pool"
            value={stats.total_profiles}
            sub={stats.last_added_at ? `Last added ${formatDate(stats.last_added_at)}` : undefined}
          />
          <StatCard
            label="Avg. experience"
            value={`${stats.avg_experience_years} yrs`}
            sub="across all profiles"
          />
          <div className="dash-stat-card dash-seniority-card">
            <div className="dash-stat-label">Seniority mix</div>
            <div className="dash-seniority-bars">
              {Object.entries(stats.seniority_distribution).map(([s, count]) => (
                <div key={s} className="dash-seniority-row">
                  <span className="dash-seniority-label">{s}</span>
                  <div className="dash-seniority-bar-wrap">
                    <div
                      className="dash-seniority-bar-fill"
                      style={{
                        width: `${Math.round((count / stats.total_profiles) * 100)}%`,
                        background: SENIORITY_COLORS[s] ?? "#6366f1",
                      }}
                    />
                  </div>
                  <span className="dash-seniority-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-label">Top skills in pool</div>
            <div className="dash-top-skills">
              {stats.top_skills.slice(0, 8).map((skill) => (
                <span key={skill} className="dash-skill-chip">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="dash-controls">
        <input
          className="dash-search-input"
          placeholder="Search by name or title…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <select
          className="dash-seniority-select"
          value={filterSeniority}
          onChange={(e) => setFilterSeniority(e.target.value)}
        >
          {seniorityOptions.map((o) => (
            <option key={o} value={o}>{o === "All" ? "All seniorities" : o}</option>
          ))}
        </select>
        <span className="dash-result-count">
          {filtered.length} of {records.length} profiles
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="dash-loading">
          <div className="dash-spinner" />
          Loading knowledge base…
        </div>
      ) : records.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon"><DatabaseIcon /></div>
          <div className="dash-empty-title">No profiles indexed yet</div>
          <div className="dash-empty-sub">Upload and index resumes using the Screen Resume button.</div>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="dash-th dash-th-num">#</th>
                <Th col="name" active={sortCol} dir={sortDir} onSort={handleSort}>Name</Th>
                <Th col="title" active={sortCol} dir={sortDir} onSort={handleSort}>Title</Th>
                <Th col="location" active={sortCol} dir={sortDir} onSort={handleSort}>Location</Th>
                <Th col="seniority" active={sortCol} dir={sortDir} onSort={handleSort}>Seniority</Th>
                <Th col="years_experience" active={sortCol} dir={sortDir} onSort={handleSort}>Exp.</Th>
                <th className="dash-th">Top Skills</th>
                <Th col="indexed_at" active={sortCol} dir={sortDir} onSort={handleSort}>Added</Th>
                <th className="dash-th dash-th-action" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.candidate_id} className="dash-tr">
                  <td className="dash-td dash-td-num">{i + 1}</td>
                  <td className="dash-td dash-td-name">
                    <div className="dash-name">{r.name}</div>
                    {r.industries.length > 0 && (
                      <div className="dash-industry">{r.industries.slice(0, 2).join(", ")}</div>
                    )}
                  </td>
                  <td className="dash-td">{r.title}</td>
                  <td className="dash-td dash-td-loc">{r.location}</td>
                  <td className="dash-td">
                    <span
                      className="dash-seniority-badge"
                      style={{ borderColor: SENIORITY_COLORS[r.seniority] ?? "#6366f1",
                               color: SENIORITY_COLORS[r.seniority] ?? "#6366f1" }}
                    >
                      {r.seniority}
                    </span>
                  </td>
                  <td className="dash-td dash-td-exp">{r.years_experience}y</td>
                  <td className="dash-td">
                    <div className="dash-skills-cell">
                      {r.skills.slice(0, 4).map((s) => (
                        <span key={s} className="dash-skill-chip-sm">{s}</span>
                      ))}
                      {r.skills.length > 4 && (
                        <span className="dash-skill-more">+{r.skills.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="dash-td dash-td-date">{formatDate(r.indexed_at)}</td>
                  <td className="dash-td dash-td-action">
                    <button
                      className="dash-delete-btn"
                      title="Remove from knowledge base"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function Th({
  col, active, dir, onSort, children,
}: {
  col: SortCol;
  active: SortCol;
  dir: SortDir;
  onSort: (c: SortCol) => void;
  children: React.ReactNode;
}) {
  return (
    <th className={`dash-th dash-th-sortable${col === active ? " sorted" : ""}`} onClick={() => onSort(col)}>
      {children} <SortArrow col={col} active={active} dir={dir} />
    </th>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
    >
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getKnowledgeBaseStats,
  listCandidatesPage,
  deleteCandidate,
  getResumeUrl,
  type CandidateRecord,
  type KnowledgeBaseStats,
} from "../api/client";

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

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
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
  name, onConfirm, onCancel, loading,
}: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Remove candidate</div>
        <div className="modal-body">
          Remove <strong>{name}</strong> from the knowledge base? This deletes all indexed
          data and the source PDF from storage. This cannot be undone.
        </div>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="modal-btn-delete" onClick={onConfirm} disabled={loading}>
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  // ── Stats (separate, cached server-side) ─────────────────────────────────
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Paginated candidates ──────────────────────────────────────────────────
  const [records, setRecords] = useState<CandidateRecord[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cursor stack: index 0 = first page (cursor=null), pushed on "next", popped on "prev"
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  // Server-reported total (-1 = not yet known)
  const [serverTotal, setServerTotal] = useState(-1);

  // ── Table controls ────────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState("");
  const [filterSeniority, setFilterSeniority] = useState("All");
  // True when records[] holds server-side search results (not a pagination page)
  const [searchMode, setSearchMode] = useState(false);
  const searchModeRef = useRef(false);

  // ── Delete + resume ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<CandidateRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resumeLoading, setResumeLoading] = useState<Record<string, boolean>>({});

  // Guard against setting state after unmount
  const mounted = useRef(true);
  useEffect(() => {
    searchModeRef.current = searchMode;
  }, [searchMode]);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getKnowledgeBaseStats();
      if (!mounted.current) return;
      setStats(s);
      setServerTotal(s.total_profiles);
    } catch (err) {
      if (!mounted.current) return;
      // Stats failure is non-fatal — candidates can still load
      logger.warn?.("stats_load_failed", err);
    } finally {
      if (mounted.current) setStatsLoading(false);
    }
  }, []);

  const loadPage = useCallback(async (cursor: string | null) => {
    setPageLoading(true);
    setError(null);
    try {
      const page = await listCandidatesPage(cursor, PAGE_SIZE);
      if (!mounted.current) return;
      setRecords(page.candidates);
      setNextCursor(page.next_cursor);
      // Update total from page response if stats haven't loaded yet
      if (page.total >= 0) setServerTotal((prev) => (prev < 0 ? page.total : prev));
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      if (mounted.current) setPageLoading(false);
    }
  }, []);

  // Current seniority in a ref so the debounce closure always reads the latest value
  // without needing filterSeniority in its dependency array (which would cause double-fires).
  const filterSeniorityRef = useRef("All");

  const loadFiltered = useCallback(async (term: string, sen: string) => {
    setPageLoading(true);
    setError(null);
    setSearchMode(true);
    try {
      const page = await listCandidatesPage(null, 500, term || undefined, sen !== "All" ? sen : undefined);
      if (!mounted.current) return;
      setRecords(page.candidates);
      setNextCursor(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      if (mounted.current) setPageLoading(false);
    }
  }, []);

  // Seniority dropdown: fire immediately (no debounce), update ref before the call.
  const handleSeniorityChange = useCallback((newSeniority: string) => {
    setFilterSeniority(newSeniority);
    filterSeniorityRef.current = newSeniority;
    const term = filterText.trim();
    if (!term && newSeniority === "All") {
      if (searchModeRef.current) {
        setSearchMode(false);
        setCursorStack([null]);
        loadPage(null);
      }
      return;
    }
    loadFiltered(term, newSeniority);
  }, [filterText, loadPage, loadFiltered]);

  // Text input: debounce 350 ms, read current seniority from ref to avoid double-fires.
  useEffect(() => {
    const term = filterText.trim();
    if (!term) {
      if (filterSeniorityRef.current === "All" && searchModeRef.current) {
        setSearchMode(false);
        setCursorStack([null]);
        loadPage(null);
      }
      // If seniority is still active, stay in filter mode — handleSeniorityChange already loaded the view.
      return;
    }
    const timer = setTimeout(() => loadFiltered(term, filterSeniorityRef.current), 350);
    return () => clearTimeout(timer);
  }, [filterText, loadPage, loadFiltered]);

  // Load stats + first page in parallel on mount
  useEffect(() => {
    Promise.all([loadStats(), loadPage(null)]);
  }, []);

  // ── Pagination ────────────────────────────────────────────────────────────

  const currentPage = cursorStack.length; // 1-indexed

  const handleNext = useCallback(() => {
    if (!nextCursor) return;
    const newStack = [...cursorStack, nextCursor];
    setCursorStack(newStack);
    loadPage(nextCursor);
  }, [cursorStack, nextCursor, loadPage]);

  const handlePrev = useCallback(() => {
    if (cursorStack.length <= 1) return;
    const newStack = cursorStack.slice(0, -1);
    setCursorStack(newStack);
    loadPage(newStack[newStack.length - 1]);
  }, [cursorStack, loadPage]);

  const handleFirst = useCallback(() => {
    setCursorStack([null]);
    loadPage(null);
  }, [loadPage]);

  const handleRefresh = useCallback(() => {
    setCursorStack([null]);
    Promise.all([loadStats(), loadPage(null)]);
  }, [loadStats, loadPage]);

  // Both text and seniority are now filtered server-side; records is already the result.
  const filtered = records;

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCandidate(deleteTarget.candidate_id);
      setRecords((prev) => prev.filter((r) => r.candidate_id !== deleteTarget.candidate_id));
      // Decrement local total — server cache was invalidated by the delete endpoint
      setServerTotal((prev) => Math.max(0, prev - 1));
      setStats((prev) => prev ? { ...prev, total_profiles: Math.max(0, prev.total_profiles - 1) } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Resume ────────────────────────────────────────────────────────────────

  const handleViewResume = useCallback(async (candidateId: string) => {
    setResumeLoading((prev) => ({ ...prev, [candidateId]: true }));
    try {
      const url = await getResumeUrl(candidateId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resume");
    } finally {
      setResumeLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  }, []);

  // ── Pagination display helpers ─────────────────────────────────────────────
  const totalKnown = serverTotal >= 0;
  const pageStart = searchMode ? 1 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = pageStart + filtered.length - 1;
  const totalPages = totalKnown ? Math.ceil(serverTotal / PAGE_SIZE) : null;
  const seniorityOptions = ["All", "Junior", "Mid-Level", "Senior", "Staff", "Principal"];

  const isFiltering = searchMode;

  return (
    <div className="dash-pane">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-title">Knowledge Base</div>
          <div className="dash-header-sub">
            {searchMode
              ? `Search results across all ${totalKnown ? serverTotal.toLocaleString() : ""} profiles`
              : totalKnown
              ? `${serverTotal.toLocaleString()} profiles · paginated ${PAGE_SIZE}/page`
              : "Manage your indexed talent pool"}
          </div>
        </div>
        <button className="dash-refresh-btn" onClick={handleRefresh} disabled={pageLoading || statsLoading} title="Refresh">
          <RefreshIcon spinning={pageLoading || statsLoading} />
          Refresh
        </button>
      </div>

      {error && <div className="dash-error">{error}</div>}

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {statsLoading && !stats ? (
        <div className="dash-stats-loading">
          <div className="dash-spinner" style={{ width: 16, height: 16 }} />
          Computing pool stats…
        </div>
      ) : stats ? (
        <div className="dash-stats-row">
          <StatCard
            label="Profiles in pool"
            value={stats.total_profiles.toLocaleString()}
            sub={stats.last_added_at ? `Last added ${formatDate(stats.last_added_at)}` : undefined}
          />
          <StatCard
            label="Avg. experience"
            value={`${stats.avg_experience_years} yrs`}
            sub={stats.is_sampled ? "based on sample" : "across all profiles"}
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

          {/* Experience range distribution */}
          <div className="dash-stat-card dash-seniority-card">
            <div className="dash-stat-label">Experience ranges</div>
            <div className="dash-seniority-bars">
              {Object.entries(stats.experience_distribution).map(([bucket, count]) => (
                <div key={bucket} className="dash-seniority-row">
                  <span className="dash-seniority-label">{bucket}</span>
                  <div className="dash-seniority-bar-wrap">
                    <div
                      className="dash-seniority-bar-fill"
                      style={{
                        width: `${Math.round((count / stats.total_profiles) * 100)}%`,
                        background: "#0ea5e9",
                      }}
                    />
                  </div>
                  <span className="dash-seniority-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top skills */}
          <div className="dash-stat-card">
            <div className="dash-stat-label">Top skills in pool</div>
            <div className="dash-top-skills">
              {stats.top_skills.slice(0, 8).map((skill) => (
                <span key={skill} className="dash-skill-chip">{skill}</span>
              ))}
            </div>
          </div>

          {/* Top locations */}
          <div className="dash-stat-card">
            <div className="dash-stat-label">Top locations</div>
            <div className="dash-top-skills">
              {stats.top_locations.map((loc) => (
                <span key={loc} className="dash-skill-chip dash-chip-loc">{loc}</span>
              ))}
            </div>
          </div>

          {/* Top industries */}
          <div className="dash-stat-card">
            <div className="dash-stat-label">Industries represented</div>
            <div className="dash-top-skills">
              {stats.top_industries.map((ind) => (
                <span key={ind} className="dash-skill-chip dash-chip-ind">{ind}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="dash-controls">
        <input
          className="dash-search-input"
          placeholder="Search all profiles by name, title, or role…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <select
          className="dash-seniority-select"
          value={filterSeniority}
          onChange={(e) => handleSeniorityChange(e.target.value)}
        >
          {seniorityOptions.map((o) => (
            <option key={o} value={o}>{o === "All" ? "All seniorities" : o}</option>
          ))}
        </select>
        <span className="dash-result-count">
          {searchMode
            ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} across all profiles`
            : totalKnown
            ? `${serverTotal.toLocaleString()} total profiles`
            : `${records.length} loaded`}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {pageLoading && records.length === 0 ? (
        <div className="dash-loading">
          <div className="dash-spinner" />
          Loading candidates…
        </div>
      ) : records.length === 0 && !pageLoading ? (
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
                <th className="dash-th">Name</th>
                <th className="dash-th">Title</th>
                <th className="dash-th">Location</th>
                <th className="dash-th">Seniority</th>
                <th className="dash-th">Exp.</th>
                <th className="dash-th">Top Skills</th>
                <th className="dash-th">Added</th>
                <th className="dash-th dash-th-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.candidate_id} className="dash-tr">
                  <td className="dash-td dash-td-num">{pageStart + i}</td>
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
                      style={{
                        borderColor: SENIORITY_COLORS[r.seniority] ?? "#6366f1",
                        color: SENIORITY_COLORS[r.seniority] ?? "#6366f1",
                      }}
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
                      className="dash-view-btn"
                      title={r.blob_filename ? "Open resume PDF in new tab" : "No PDF uploaded for this candidate"}
                      disabled={!r.blob_filename || !!resumeLoading[r.candidate_id]}
                      onClick={() => handleViewResume(r.candidate_id)}
                    >
                      {resumeLoading[r.candidate_id] ? <SpinnerIcon /> : <EyeIcon />}
                      {resumeLoading[r.candidate_id] ? "Loading…" : "View Resume"}
                    </button>
                    <button
                      className="dash-delete-btn"
                      title="Remove from knowledge base"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <TrashIcon />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Pagination controls — hidden in search mode ─────────────────── */}
          {searchMode ? (
            <div className="dash-pagination">
              <span className="dash-page-info">
                {pageLoading
                  ? "Searching…"
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${filterText.trim()}"  ·  clear search to browse all`}
              </span>
            </div>
          ) : (
            <div className="dash-pagination">
              <button
                className="dash-page-btn"
                onClick={handleFirst}
                disabled={currentPage === 1 || pageLoading}
                title="First page"
              >«</button>
              <button
                className="dash-page-btn"
                onClick={handlePrev}
                disabled={currentPage === 1 || pageLoading}
                title="Previous page"
              >‹</button>

              <span className="dash-page-info">
                {pageLoading ? (
                  "Loading…"
                ) : (
                  <>
                    Page {currentPage}{totalPages ? ` of ${totalPages}` : ""}
                    <span className="dash-page-range">
                      &nbsp;· showing {pageStart}–{pageEnd} of {totalKnown ? serverTotal.toLocaleString() : "?"}
                    </span>
                  </>
                )}
              </span>

              <button
                className="dash-page-btn"
                onClick={handleNext}
                disabled={!nextCursor || pageLoading}
                title="Next page"
              >›</button>
            </div>
          )}
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

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

// Minimal console shim so logger.warn doesn't throw in browser
const logger = { warn: (..._args: unknown[]) => {} };

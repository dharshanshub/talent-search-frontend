import type { ChatSession } from "../hooks/useChatHistory";

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 7v6l7 5 7-5V7L10 2z" fill="white" fillOpacity=".95" />
      <path d="M10 2v14M3 7l7 3 7-3" stroke="white" strokeWidth="1.2" strokeOpacity=".45" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Group sessions by recency
function groupSessions(sessions: ChatSession[]) {
  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const older: ChatSession[] = [];
  const now = Date.now();

  for (const s of sessions) {
    const days = Math.floor((now - s.createdAt) / 86400000);
    if (days === 0) today.push(s);
    else if (days === 1) yesterday.push(s);
    else older.push(s);
  }
  return { today, yesterday, older };
}

export function Sidebar({ sessions, activeId, onNew, onSelect, onDelete }: Props) {
  const groups = groupSessions(sessions);

  const renderGroup = (label: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div className="sb-group" key={label}>
        <div className="sb-group-label">{label}</div>
        {items.map((s) => (
          <div
            key={s.id}
            className={`sb-item${s.id === activeId ? " active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <ChatIcon />
            <div className="sb-item-content">
              <div className="sb-item-title">{s.title}</div>
              <div className="sb-item-time">{relTime(s.createdAt)}</div>
            </div>
            <button
              className="sb-delete"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="sidebar">
      {/* brand */}
      <div className="sb-brand">
        <div className="sb-logo-mark"><LogoMark /></div>
        <div className="sb-brand-text">
          <div className="sb-brand-name">TalentAI</div>
          <div className="sb-brand-sub">Candidate Search</div>
        </div>
      </div>

      {/* new chat */}
      <div className="sb-top">
        <button className="sb-new-btn" onClick={onNew}>
          <PlusIcon />
          New Search
        </button>
      </div>

      {/* history */}
      <div className="sb-history">
        {sessions.length === 0 ? (
          <div className="sb-empty">
            <div className="sb-empty-icon">
              <ChatIcon />
            </div>
            <div className="sb-empty-text">No searches yet</div>
            <div className="sb-empty-sub">Your search history will appear here</div>
          </div>
        ) : (
          <>
            {renderGroup("Today", groups.today)}
            {renderGroup("Yesterday", groups.yesterday)}
            {renderGroup("Older", groups.older)}
          </>
        )}
      </div>

      {/* footer */}
      <div className="sb-footer">
        <div className="sb-footer-stat">
          <span className="sb-footer-num">{sessions.length}</span> session{sessions.length !== 1 ? "s" : ""}
        </div>
        <div className="sb-footer-dot" />
        <div className="sb-footer-stat">100 profiles</div>
      </div>
    </aside>
  );
}

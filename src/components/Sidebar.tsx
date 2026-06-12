import type { ChatSession } from "../hooks/useChatHistory";

type View = "chat" | "dashboard";

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  activeView: View;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onScreen: () => void;
  onViewChange: (view: View) => void;
}

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* outer hexagon */}
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="white" strokeWidth="1.4" strokeOpacity=".6" fill="none"/>
      {/* center node */}
      <circle cx="12" cy="12" r="2.5" fill="white"/>
      {/* spokes */}
      <line x1="12" y1="9.4" x2="12" y2="4" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="14.2" y1="10.7" x2="19.2" y2="7.8" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="14.2" y1="13.3" x2="19.2" y2="16.2" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="12" y1="14.6" x2="12" y2="20" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="9.8" y1="13.3" x2="4.8" y2="16.2" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="9.8" y1="10.7" x2="4.8" y2="7.8" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      {/* outer nodes */}
      <circle cx="12" cy="3.5" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="19.8" cy="7.8" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="19.8" cy="16.2" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="20.5" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="4.2" cy="16.2" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="4.2" cy="7.8" r="1.4" fill="white" fillOpacity=".9"/>
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

function ScreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
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

export function Sidebar({
  sessions, activeId, activeView, onNew, onSelect, onDelete, onScreen, onViewChange,
}: Props) {
  const groups = groupSessions(sessions);

  const renderGroup = (label: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div className="sb-group" key={label}>
        <div className="sb-group-label">{label}</div>
        {items.map((s) => (
          <div
            key={s.id}
            className={`sb-item${s.id === activeId && activeView === "chat" ? " active" : ""}`}
            onClick={() => { onViewChange("chat"); onSelect(s.id); }}
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

      {/* nav actions */}
      <div className="sb-top">
        <button className="sb-new-btn" onClick={() => { onViewChange("chat"); onNew(); }}>
          <PlusIcon />
          New Search
        </button>
        <div className="sb-section-label">Tools</div>
        <button className="sb-screen-btn" onClick={onScreen}>
          <ScreenIcon />
          Screen Resume
        </button>
        <button
          className={`sb-dash-btn${activeView === "dashboard" ? " active" : ""}`}
          onClick={() => onViewChange("dashboard")}
        >
          <DashboardIcon />
          Knowledge Base
        </button>
      </div>

      {/* history — only visible when in chat view */}
      <div className="sb-history">
        {sessions.length === 0 ? (
          <div className="sb-empty">
            <div className="sb-empty-icon"><ChatIcon /></div>
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
        <div className="sb-footer-brand">TalentAI</div>
      </div>
    </aside>
  );
}

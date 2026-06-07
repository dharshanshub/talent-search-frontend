import { useEffect, useState } from "react";
import type { CandidateMatch } from "../api/client";
import { CandidateCard } from "./CandidateCard";
import { MessageBubble } from "./MessageBubble";
import { ResumeDrawer } from "./ResumeDrawer";
import { TypingIndicator } from "./TypingIndicator";
import { useSearch } from "../hooks/useSearch";
import type { ChatMessage } from "../hooks/useChatHistory";

interface Props {
  sessionId: string | null;
  initialMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

const EXAMPLES = [
  { tag: "Frontend",      text: "Senior React engineer in Berlin with fintech experience" },
  { tag: "Data",          text: "Staff ML engineer PyTorch healthtech, 8+ years" },
  { tag: "DevOps",        text: "DevOps engineer with Kubernetes and AWS, 5+ years" },
  { tag: "Mobile",        text: "Mid-level Flutter developer based in Singapore" },
];

function SearchIcon({ size = 30, color = "#6366f1" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" style={{ position: "relative", zIndex: 1 }}>
      <path d="M10 2L3 7v6l7 5 7-5V7L10 2z" fill="white" fillOpacity=".97" />
      <path d="M10 2v14M3 7l7 3 7-3" stroke="white" strokeWidth="1.3" strokeOpacity=".4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function ChatWindow({ sessionId, initialMessages, onMessagesChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [drawerCandidate, setDrawerCandidate] = useState<CandidateMatch | null>(null);
  const { loading, error, search } = useSearch();
  // Sync when switching sessions
  useEffect(() => {
    setMessages(initialMessages);
    setInput("");
  }, [sessionId]);

  const push = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    onMessagesChange(msgs);
  };

  const run = async (query: string) => {
    const q = query.trim();
    if (!q || loading) return;

    setInput("");
    const withUser: ChatMessage[] = [...messages, { role: "user", content: q }];
    push(withUser);

    const result = await search(q);

    if (result) {
      push([
        ...withUser,
        { role: "assistant", content: result.answer, candidates: result.candidates },
      ]);
    } else {
      push([
        ...withUser,
        { role: "assistant", content: error ?? "Something went wrong.", isError: true },
      ]);
    }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="chat-pane">

      {/* ── Header ───────────────────────────────── */}
      <header className="chat-header">
        <div className="chat-header-running-line" />

        {/* left: logo + title */}
        <div className="chat-header-left">
          <div className="chat-header-icon">
            <LogoMark />
          </div>
          <div className="chat-header-text">
            <div className="chat-header-title">
              {isEmpty ? (
                <span className="chat-header-title-gradient">TalentAI — Find your perfect hire</span>
              ) : (() => {
                const t = messages.find((m) => m.role === "user")?.content ?? "";
                return t.length > 56 ? t.slice(0, 56) + "…" : t;
              })()}
            </div>
            <div className="chat-header-sub">
              <span className="chat-header-badge chat-header-badge--ai">
                <span className="chat-header-badge-pulse" />
                AI Powered
              </span>
              <span className="chat-header-badge">Smart Matching</span>
              <span className="chat-header-badge">Instant Insights</span>
            </div>
          </div>
        </div>

        {/* right: actions + avatar */}
        <div className="chat-header-right">
          <button className="chat-header-action-btn" title="Notifications">
            <BellIcon />
          </button>
          <div className="chat-header-avatar">
            <span>D</span>
            <div className="chat-header-avatar-status" />
          </div>
        </div>
      </header>

      {/* ── Messages ─────────────────────────────── */}
      <div className="messages">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-hero"><SearchIcon /></div>
            <div className="empty-title">Find your ideal candidate</div>
            <div className="empty-subtitle">
              Describe the candidate you need in plain English. TalentAI uses semantic
              search and AI to find the best-matching candidates from your talent pool
              and generates instant insights on every match.
            </div>
            <div className="example-grid">
              {EXAMPLES.map((ex) => (
                <button key={ex.text} className="example-card" onClick={() => run(ex.text)}>
                  <div className="example-tag">{ex.tag}</div>
                  <div className="example-text">{ex.text}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i}>
                <MessageBubble role={msg.role} content={msg.content} isError={msg.isError} />
                {msg.candidates && msg.candidates.length > 0 && (
                  <div className="candidates-section">
                    <div className="candidates-header">
                      <span className="candidates-count">
                        {msg.candidates.length} candidate{msg.candidates.length !== 1 ? "s" : ""} found
                      </span>
                      <div className="candidates-divider" />
                    </div>
                    {msg.candidates.map((c, idx) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        rank={idx + 1}
                        onViewResume={setDrawerCandidate}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
      </div>

      {/* ── Input ────────────────────────────────── */}
      <div className="input-area">
        <form className="input-form" onSubmit={(e) => { e.preventDefault(); run(input); }}>
          <input
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the candidate you are looking for…"
            disabled={loading}
            autoFocus
          />
          <button className="send-btn" type="submit" disabled={loading || !input.trim()} title="Search">
            <SendIcon />
          </button>
        </form>
        <div className="input-hint">
          Try: <strong>"Senior backend engineer Python Berlin"</strong> or{" "}
          <strong>"ML engineer PyTorch healthtech 5+ years"</strong>
        </div>
      </div>

      {/* ── Resume drawer ────────────────────────── */}
      {drawerCandidate && (
        <ResumeDrawer
          candidate={drawerCandidate}
          onClose={() => setDrawerCandidate(null)}
        />
      )}

    </div>
  );
}

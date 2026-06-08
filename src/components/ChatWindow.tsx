import { useEffect, useState } from "react";
import type { CandidateMatch, ConversationMessage } from "../api/client";
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
  { tag: "Frontend",  text: "Senior React engineer in Berlin with fintech experience" },
  { tag: "Data",      text: "Staff ML engineer PyTorch healthtech, 8+ years" },
  { tag: "DevOps",    text: "DevOps engineer with Kubernetes and AWS, 5+ years" },
  { tag: "Mobile",    text: "Mid-level Flutter developer based in Singapore" },
];


function LogoMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ position: "relative", zIndex: 1 }}>
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="white" strokeWidth="1.4" strokeOpacity=".6" fill="none"/>
      <circle cx="12" cy="12" r="2.5" fill="white"/>
      <line x1="12" y1="9.4" x2="12" y2="4" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="14.2" y1="10.7" x2="19.2" y2="7.8" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="14.2" y1="13.3" x2="19.2" y2="16.2" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="12" y1="14.6" x2="12" y2="20" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="9.8" y1="13.3" x2="4.8" y2="16.2" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <line x1="9.8" y1="10.7" x2="4.8" y2="7.8" stroke="white" strokeWidth="1" strokeOpacity=".75"/>
      <circle cx="12" cy="3.5" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="19.8" cy="7.8" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="19.8" cy="16.2" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="12" cy="20.5" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="4.2" cy="16.2" r="1.4" fill="white" fillOpacity=".9"/>
      <circle cx="4.2" cy="7.8" r="1.4" fill="white" fillOpacity=".9"/>
    </svg>
  );
}

function EmptyHeroIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="50%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="url(#heroGrad)" strokeWidth="1.4" fill="none"/>
      <circle cx="12" cy="12" r="2.8" fill="url(#heroGrad)"/>
      <line x1="12" y1="9.1" x2="12" y2="4" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <line x1="14.4" y1="10.55" x2="19.4" y2="7.65" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <line x1="14.4" y1="13.45" x2="19.4" y2="16.35" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <line x1="12" y1="14.9" x2="12" y2="20" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <line x1="9.6" y1="13.45" x2="4.6" y2="16.35" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <line x1="9.6" y1="10.55" x2="4.6" y2="7.65" stroke="url(#heroGrad)" strokeWidth="1.1" strokeOpacity=".9"/>
      <circle cx="12" cy="3.5" r="1.6" fill="url(#heroGrad)"/>
      <circle cx="20" cy="7.8" r="1.6" fill="url(#heroGrad)"/>
      <circle cx="20" cy="16.2" r="1.6" fill="url(#heroGrad)"/>
      <circle cx="12" cy="20.5" r="1.6" fill="url(#heroGrad)"/>
      <circle cx="4" cy="16.2" r="1.6" fill="url(#heroGrad)"/>
      <circle cx="4" cy="7.8" r="1.6" fill="url(#heroGrad)"/>
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

  // Streaming state: partial text and candidates arriving before the stream completes
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [streamingCandidates, setStreamingCandidates] = useState<CandidateMatch[]>([]);

  const { loading, error, search } = useSearch();

  // Sync when switching sessions
  useEffect(() => {
    setMessages(initialMessages);
    setInput("");
    setStreamingText(null);
    setStreamingCandidates([]);
  }, [sessionId]);

  const push = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    onMessagesChange(msgs);
  };

  const run = async (query: string) => {
    const q = query.trim();
    if (!q || loading) return;

    setInput("");
    setStreamingText("");
    setStreamingCandidates([]);

    const withUser: ChatMessage[] = [...messages, { role: "user", content: q }];
    push(withUser);

    // Build conversation history for the agent (exclude candidate data — text only)
    const history: ConversationMessage[] = withUser.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await search(
      q,
      history,
      (partial) => setStreamingText(partial),
      (liveCandidates) => setStreamingCandidates(liveCandidates),
    );

    setStreamingText(null);
    setStreamingCandidates([]);

    if (result) {
      push([
        ...withUser,
        {
          role: "assistant",
          content: result.answer,
          candidates: result.candidates.length > 0 ? result.candidates : undefined,
        },
      ]);
    } else {
      push([
        ...withUser,
        { role: "assistant", content: error ?? "Something went wrong.", isError: true },
      ]);
    }
  };

  // Candidates arrive via onCandidates SSE event before streaming text is done
  // We surface them via the search hook's onCandidates callback, but since useSearch
  // only exposes the final result we surface live candidates from the streaming text's
  // accompanying candidates via a local handler exposed through a closure in run().
  // For live candidate preview during stream we re-expose via the agent.py SSE ordering:
  // candidates event always fires before deltas. So we capture them in useSearch itself.
  // The current implementation captures them in `result.candidates` after done.
  // For a live preview while text streams, we need to lift this — future enhancement.

  const isEmpty = messages.length === 0 && !loading && streamingText === null;
  const isStreaming = streamingText !== null;

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
            <div className="empty-hero"><EmptyHeroIcon /></div>
            <div className="empty-eyebrow">AI-Powered Talent Search</div>
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

            {/* Live streaming message — shown while the stream is in progress */}
            {isStreaming && (
              <div>
                {streamingText === "" ? (
                  <TypingIndicator />
                ) : (
                  <MessageBubble
                    role="assistant"
                    content={streamingText}
                    isStreaming
                  />
                )}
                {streamingCandidates.length > 0 && (
                  <div className="candidates-section">
                    <div className="candidates-header">
                      <span className="candidates-count">
                        {streamingCandidates.length} candidate{streamingCandidates.length !== 1 ? "s" : ""} found
                      </span>
                      <div className="candidates-divider" />
                    </div>
                    {streamingCandidates.map((c, idx) => (
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
            )}
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

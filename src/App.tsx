import { useEffect } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { Sidebar } from "./components/Sidebar";
import { useChatHistory } from "./hooks/useChatHistory";

export default function App() {
  const {
    sessions,
    activeId,
    activeSession,
    newSession,
    updateSession,
    deleteSession,
    selectSession,
  } = useChatHistory();

  // Auto-create first session on mount
  useEffect(() => {
    if (sessions.length === 0) {
      newSession();
    } else if (!activeId) {
      selectSession(sessions[0].id);
    }
  }, []);

  const handleNew = () => newSession();

  const handleMessagesChange = (messages: import("./hooks/useChatHistory").ChatMessage[]) => {
    if (activeId) updateSession(activeId, messages);
  };

  return (
    <div className="layout">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={handleNew}
        onSelect={selectSession}
        onDelete={deleteSession}
      />
      <ChatWindow
        key={activeId ?? "empty"}
        sessionId={activeId}
        initialMessages={activeSession?.messages ?? []}
        onMessagesChange={handleMessagesChange}
      />
    </div>
  );
}

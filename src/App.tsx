import { useEffect, useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { DashboardPage } from "./components/DashboardPage";
import { ScreenDrawer } from "./components/ScreenDrawer";
import { Sidebar } from "./components/Sidebar";
import { useChatHistory } from "./hooks/useChatHistory";

type View = "chat" | "dashboard";

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
  const [screenOpen, setScreenOpen] = useState(false);
  const [view, setView] = useState<View>("chat");

  useEffect(() => {
    if (sessions.length === 0) {
      newSession();
    } else if (!activeId) {
      selectSession(sessions[0].id);
    }
  }, []);

  const handleNew = () => {
    newSession();
    setView("chat");
  };

  const handleMessagesChange = (messages: import("./hooks/useChatHistory").ChatMessage[]) => {
    if (activeId) updateSession(activeId, messages);
  };

  return (
    <div className="layout">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        activeView={view}
        onNew={handleNew}
        onSelect={selectSession}
        onDelete={deleteSession}
        onScreen={() => setScreenOpen(true)}
        onViewChange={setView}
      />
      {screenOpen && <ScreenDrawer onClose={() => setScreenOpen(false)} />}
      {view === "dashboard" ? (
        <DashboardPage />
      ) : (
        <ChatWindow
          key={activeId ?? "empty"}
          sessionId={activeId}
          initialMessages={activeSession?.messages ?? []}
          onMessagesChange={handleMessagesChange}
        />
      )}
    </div>
  );
}

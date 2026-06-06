interface Props {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export function MessageBubble({ role, content, isError }: Props) {
  return (
    <div className={`message-row ${role}`}>
      {role === "user" ? (
        <div className="bubble-user">{content}</div>
      ) : (
        <div className={`bubble-assistant${isError ? " error" : ""}`}>{content}</div>
      )}
    </div>
  );
}

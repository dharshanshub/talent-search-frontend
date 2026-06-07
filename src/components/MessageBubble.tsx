import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  /** True while this message is still being streamed (shows cursor). */
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isError, isStreaming }: Props) {
  return (
    <div className={`message-row ${role}`}>
      {role === "user" ? (
        <div className="bubble-user">{content}</div>
      ) : (
        <div className={`bubble-assistant${isError ? " error" : ""}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {isStreaming && <span className="streaming-cursor" aria-hidden />}
        </div>
      )}
    </div>
  );
}

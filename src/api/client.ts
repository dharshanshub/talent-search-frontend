const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CandidateMatch {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  years_experience: number;
  last_updated: string;
  score: number;
  summary: string | null;
  /** Blob filename stored in Pinecone. Null for legacy seeded candidates. */
  blob_filename: string | null;
}

export interface SearchResponse {
  query: string;
  answer: string;
  candidates: CandidateMatch[];
  request_id: string;
}

export interface ApiError {
  error_code: string;
  message: string;
  path: string;
  method: string;
  request_id: string;
}

export type Seniority = "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal";

export interface ExtractedProfile {
  name: string;
  title: string;
  role: string;
  seniority: Seniority;
  location: string;
  years_experience: number;
  skills: string[];
  industries: string[];
  summary: string;
}

export interface UploadResponse {
  /** Generated at upload time — shared key for Blob Storage and Pinecone. */
  candidate_id: string;
  blob_filename: string;
  extracted: ExtractedProfile;
  raw_text: string;
}

export interface IndexResponse {
  candidate_id: string;
  chunks_indexed: number;
  message: string;
}

/** Callbacks for the streaming search response. */
export interface StreamCallbacks {
  onCandidates: (candidates: CandidateMatch[]) => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Agentic streaming search. Sends query + conversation history to the agent
 * endpoint and fires callbacks as SSE events arrive.
 *
 * Event order: onCandidates? → onDelta* → onDone  (or onError on failure)
 */
export async function searchTalentStream(
  query: string,
  history: ConversationMessage[],
  callbacks: StreamCallbacks,
  topK?: number,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/v1/search/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, messages: history, top_k: topK ?? null }),
    });
  } catch {
    callbacks.onError("Network error — could not reach the server.");
    return;
  }

  if (!response.ok) {
    try {
      const err: ApiError = await response.json();
      callbacks.onError(err.message ?? "Search failed.");
    } catch {
      callbacks.onError(`Server error (${response.status}).`);
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("Streaming not supported by the server.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        try {
          const event = JSON.parse(raw) as { type: string; [key: string]: unknown };
          if (event.type === "candidates") callbacks.onCandidates(event.data as CandidateMatch[]);
          else if (event.type === "delta") callbacks.onDelta(event.content as string);
          else if (event.type === "done") callbacks.onDone();
          else if (event.type === "error") callbacks.onError(event.message as string);
        } catch {
          // Ignore malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Knowledge base dashboard API ─────────────────────────────────────────────

export interface CandidateRecord {
  candidate_id: string;
  name: string;
  title: string;
  role: string;
  seniority: string;
  location: string;
  years_experience: number;
  skills: string[];
  industries: string[];
  blob_filename: string | null;
  indexed_at: string;
}

export interface KnowledgeBaseStats {
  total_profiles: number;
  seniority_distribution: Record<string, number>;
  avg_experience_years: number;
  last_added_at: string | null;
  top_skills: string[];
}

export interface KnowledgeBaseResponse {
  stats: KnowledgeBaseStats;
  candidates: CandidateRecord[];
}

export async function listKnowledgeBase(): Promise<KnowledgeBaseResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/knowledge-base`);
  if (!response.ok) {
    const err: ApiError = await response.json();
    throw new Error(err.message ?? "Failed to load knowledge base");
  }
  return response.json() as Promise<KnowledgeBaseResponse>;
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/knowledge-base/${candidateId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err: ApiError = await response.json();
    throw new Error(err.message ?? "Delete failed");
  }
}

export async function uploadResume(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${BASE_URL}/api/v1/candidates/upload`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const err: ApiError = await response.json();
    throw new Error(err.message ?? "Upload failed");
  }
  return response.json() as Promise<UploadResponse>;
}

export async function indexCandidate(
  candidateId: string,
  blobFilename: string,
  profile: ExtractedProfile,
  rawText: string,
): Promise<IndexResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/candidates/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidate_id: candidateId,
      blob_filename: blobFilename,
      profile,
      raw_text: rawText,
    }),
  });
  if (!response.ok) {
    const err: ApiError = await response.json();
    throw new Error(err.message ?? "Indexing failed");
  }
  return response.json() as Promise<IndexResponse>;
}

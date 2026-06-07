const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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

export async function searchTalent(
  query: string,
  topK?: number
): Promise<SearchResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });
  if (!response.ok) {
    const err: ApiError = await response.json();
    throw new Error(err.message ?? "Search failed");
  }
  return response.json() as Promise<SearchResponse>;
}

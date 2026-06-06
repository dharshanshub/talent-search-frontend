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

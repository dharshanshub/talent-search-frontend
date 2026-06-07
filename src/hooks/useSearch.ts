import { useCallback, useState } from "react";
import {
  searchTalentStream,
  type CandidateMatch,
  type ConversationMessage,
} from "../api/client";

export interface StreamSearchResult {
  candidates: CandidateMatch[];
  answer: string;
}

interface UseSearchReturn {
  loading: boolean;
  error: string | null;
  search: (
    query: string,
    history: ConversationMessage[],
    onDelta: (partial: string) => void,
    onLiveCandidates?: (candidates: CandidateMatch[]) => void,
    topK?: number,
  ) => Promise<StreamSearchResult | null>;
}

export function useSearch(): UseSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (
      query: string,
      history: ConversationMessage[],
      onDelta: (partial: string) => void,
      onLiveCandidates?: (candidates: CandidateMatch[]) => void,
      topK?: number,
    ): Promise<StreamSearchResult | null> => {
      setLoading(true);
      setError(null);

      let candidates: CandidateMatch[] = [];
      let answer = "";
      let errorMsg: string | null = null;

      await searchTalentStream(
        query,
        history,
        {
          onCandidates: (c) => {
            candidates = c;
            onLiveCandidates?.(c);
          },
          onDelta: (text) => {
            answer += text;
            onDelta(answer);
          },
          onDone: () => {},
          onError: (msg) => { errorMsg = msg; },
        },
        topK,
      );

      setLoading(false);

      if (errorMsg) {
        setError(errorMsg);
        return null;
      }

      return { candidates, answer };
    },
    [],
  );

  return { loading, error, search };
}

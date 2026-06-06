import { useCallback, useState } from "react";
import { searchTalent, type SearchResponse } from "../api/client";

interface UseSearchReturn {
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<SearchResponse | null>;
}

export function useSearch(): UseSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<SearchResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchTalent(query);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, search };
}

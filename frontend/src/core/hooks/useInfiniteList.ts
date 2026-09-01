import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteListOptions<T> {
  fetchPage: (skip: number, limit: number) => Promise<T[]>;
  pageSize?: number;
}

// Loads a list in server-paginated chunks. `loadMore` fetches the next
// chunk (skip = however many items are already loaded); `mutate` lets a
// page update or remove loaded items (e.g. after an admin approves one)
// without losing sync between the rendered list and the skip offset used
// for the next chunk.
export function useInfiniteList<T>({ fetchPage, pageSize = 12 }: UseInfiniteListOptions<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsRef = useRef<T[]>([]);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    try {
      const skip = itemsRef.current.length;
      const page = await fetchPageRef.current(skip, pageSize);
      itemsRef.current = [...itemsRef.current, ...page];
      setItems([...itemsRef.current]);
      if (page.length < pageSize) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch {
      setError("Could not load more.");
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [pageSize]);

  const reload = useCallback(() => {
    itemsRef.current = [];
    hasMoreRef.current = true;
    loadingRef.current = false;
    setItems(null);
    setHasMore(true);
    setError(null);
    void loadMore();
  }, [loadMore]);

  const mutate = useCallback((updater: (prev: T[]) => T[]) => {
    itemsRef.current = updater(itemsRef.current);
    setItems([...itemsRef.current]);
  }, []);

  useEffect(() => {
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, hasMore, isLoadingMore, error, loadMore, reload, mutate };
}

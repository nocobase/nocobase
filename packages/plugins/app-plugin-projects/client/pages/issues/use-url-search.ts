import { type RefObject, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

export interface UrlSearch {
  /** The query parameters the page renders from. */
  readonly params: URLSearchParams;
  /** The search box text, which reaches the URL 300 ms after typing stops. */
  readonly text: string;
  readonly setText: (value: string) => void;
  readonly scheduleSearch: (value: string) => void;
  /** Rewrites the query string from the latest parameters, replacing the history entry. */
  readonly updateParams: (
    mutate: (params: URLSearchParams) => URLSearchParams,
  ) => void;
  /** Cancels a pending search write and empties the box; the caller removes the parameters. */
  readonly resetText: () => void;
  readonly searchRef: RefObject<HTMLInputElement | null>;
}

/**
 * The search box and filters of a list whose state lives in the query string, written the way
 * `references/frontend/references/table.md` describes: the input keeps its own text (binding it to the URL breaks
 * IME composition and mid-text edits), writes go through `paramsRef` so two nearly simultaneous writes do not
 * overwrite each other, and back/forward sync into the input during render rather than in an effect.
 */
export function useUrlSearch(param = 'q'): UrlSearch {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get(param) ?? '';
  const searchRef = useRef<HTMLInputElement>(null);

  const paramsRef = useRef(searchParams);
  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);
  function updateParams(
    mutate: (params: URLSearchParams) => URLSearchParams,
  ): void {
    const next = mutate(new URLSearchParams(paramsRef.current));
    paramsRef.current = next;
    setSearchParams(next, { replace: true });
  }

  const [text, setText] = useState(urlSearch);
  const [ownSearch, setOwnSearch] = useState(urlSearch);
  const [seenSearch, setSeenSearch] = useState(urlSearch);
  if (urlSearch !== seenSearch) {
    setSeenSearch(urlSearch);
    if (urlSearch !== ownSearch) {
      setOwnSearch(urlSearch);
      setText(urlSearch);
    }
  }

  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function scheduleSearch(value: string): void {
    window.clearTimeout(timerRef.current);
    const addressSearch = (): string =>
      new URLSearchParams(window.location.search).get(param) ?? '';
    const startSearch = paramsRef.current.get(param) ?? '';
    const startAddress = addressSearch();
    timerRef.current = window.setTimeout(() => {
      // Navigation (back, forward, a link) during the wait wins over this write.
      if (
        (paramsRef.current.get(param) ?? '') !== startSearch ||
        addressSearch() !== startAddress
      ) {
        return;
      }
      setOwnSearch(value);
      updateParams((params) => {
        if (value) params.set(param, value);
        else params.delete(param);
        return params;
      });
    }, 300);
  }

  function resetText(): void {
    window.clearTimeout(timerRef.current);
    setText('');
    setOwnSearch('');
  }

  return {
    params: searchParams,
    text,
    setText,
    scheduleSearch,
    updateParams,
    resetText,
    searchRef,
  };
}

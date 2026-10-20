// client/hooks/use-url-search.ts
import {
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router';

export interface UrlSearchOptions {
  /** The query parameter that holds the search term. Defaults to `q`. */
  readonly param?: string;
  /** Parameters a new search term removes, such as `page`. */
  readonly resetParams?: readonly string[];
}

export interface UrlSearch {
  /** The current query parameters, for reading the page's other filters. */
  readonly searchParams: URLSearchParams;
  /** The trimmed search term in the URL: send it to the endpoint. */
  readonly search: string;
  /** What the search box shows, which runs ahead of the URL while the user types. */
  readonly text: string;
  /** Spread onto the search input. */
  readonly inputProps: {
    readonly value: string;
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    readonly onCompositionStart: (
      event: CompositionEvent<HTMLInputElement>,
    ) => void;
    readonly onCompositionEnd: (
      event: CompositionEvent<HTMLInputElement>,
    ) => void;
  };
  /** Changes parameters on top of the latest ones, replacing the history entry. */
  readonly updateParams: (mutate: (params: URLSearchParams) => void) => void;
  /** Empties the box and removes the term; `mutate` removes the page's own filters too. */
  readonly clear: (mutate?: (params: URLSearchParams) => void) => void;
}

/**
 * An Enter-submitted search box backed by a URL parameter. The input keeps its own text, so the router's transition never resets it
 * between keystrokes, a Chinese input method's pinyin is not searched, and editing in the middle keeps the caret.
 */
export function useUrlSearch({
  param = 'q',
  resetParams = [],
}: UrlSearchOptions = {}): UrlSearch {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get(param) ?? '';

  // The latest parameters: the ones this hook last wrote, or the router last updated. The function form of
  // setSearchParams only sees the parameters of the render that issued it, so two nearly simultaneous writes (the
  // search submission, a filter change) would overwrite each other. Every change starts from this value instead.
  const paramsRef = useRef(searchParams);
  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);
  function updateParams(mutate: (params: URLSearchParams) => void): void {
    const next = new URLSearchParams(paramsRef.current);
    mutate(next);
    paramsRef.current = next;
    setSearchParams(next, { replace: true });
  }

  const [text, setText] = useState(urlSearch);
  // The term this hook last wrote (or received from outside), and the term the previous render saw.
  const [ownSearch, setOwnSearch] = useState(urlSearch);
  const [seenSearch, setSeenSearch] = useState(urlSearch);
  if (urlSearch !== seenSearch) {
    // Compare with the previous value during render instead of calling setState in an effect.
    setSeenSearch(urlSearch);
    // Back, forward or a clicked link changed the term: show it. A value this hook wrote itself arrives after later
    // keystrokes (it equals ownSearch) and must not overwrite the input.
    if (urlSearch !== ownSearch) {
      setOwnSearch(urlSearch);
      setText(urlSearch);
    }
  }

  const composingRef = useRef(false);

  function submit(value: string): void {
    const term = value.trim();
    setOwnSearch(term);
    updateParams((params) => {
      if (term) params.set(param, term);
      else params.delete(param);
      for (const name of resetParams) params.delete(name);
    });
  }

  function clear(mutate?: (params: URLSearchParams) => void): void {
    setText('');
    setOwnSearch('');
    updateParams((params) => {
      params.delete(param);
      for (const name of resetParams) params.delete(name);
      mutate?.(params);
    });
  }

  return {
    searchParams,
    search: urlSearch.trim(),
    text,
    inputProps: {
      value: text,
      onChange: (event) => setText(event.target.value),
      onKeyDown: (event) => {
        if (
          event.key !== 'Enter' ||
          composingRef.current ||
          event.nativeEvent.isComposing ||
          event.keyCode === 229
        )
          return;
        event.preventDefault();
        submit(event.currentTarget.value);
      },
      onCompositionStart: () => {
        composingRef.current = true;
      },
      onCompositionEnd: () => {
        composingRef.current = false;
      },
    },
    updateParams,
    clear,
  };
}

/**
 * `search` without the parameters a view owns, for the way back to the view it covers: that view gets its search and
 * filters back unchanged, and nothing the view being left wrote stays behind in its URL.
 */
export function withoutParams(
  search: string,
  names: readonly string[],
): string {
  const params = new URLSearchParams(search);
  for (const name of names) params.delete(name);
  const rest = params.toString();
  return rest ? `?${rest}` : '';
}

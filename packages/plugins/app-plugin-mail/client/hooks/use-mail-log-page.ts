import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MAIL_PAGE_SIZE } from '../components/mail-pagination.js';
import {
  mailErrorMessage,
  type MailOffsetPage,
  type MailPage,
} from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export interface MailLogPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly loading: boolean;
  readonly error?: string;
  /** For a list paged by token: whether another page follows the shown one. */
  readonly hasNext?: boolean;
  /** For a list paged by token: the furthest page reached so far, the last that `setPage` can open. */
  readonly maxPage?: number;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly reload: () => void;
}

interface Settled<T> {
  readonly request: object;
  readonly result?: MailOffsetPage<T>;
  readonly error?: string;
}

/**
 * One page of a paged list, loaded whenever `load` (memoize it on its filters), the page or the page size changes, or
 * `reload` is called. A new `load` starts over on the first page. The last page stays shown while the next loads.
 */
export function useMailLogPage<T>(
  load: (page: number, pageSize: number) => Promise<MailOffsetPage<T>>,
): MailLogPage<T> {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [paging, setPaging] = useState({
    load,
    page: 1,
    pageSize: MAIL_PAGE_SIZE,
  });
  // A new filter starts over on the first page; adjusting state while rendering avoids a request for the old page.
  if (paging.load !== load) setPaging({ ...paging, load, page: 1 });
  const [version, setVersion] = useState(0);
  const request = useMemo(
    () => ({ load, page: paging.page, pageSize: paging.pageSize, version }),
    [load, paging.page, paging.pageSize, version],
  );
  const [settled, setSettled] = useState<Settled<T>>();
  const [shown, setShown] = useState<MailOffsetPage<T>>();
  useEffect(() => {
    let active = true;
    void request.load(request.page, request.pageSize).then(
      (result) => {
        if (!active) return;
        setSettled({ request, result });
        setShown(result);
      },
      (cause: unknown) => {
        if (active)
          setSettled({
            request,
            error: mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [request, t]);
  const current = settled?.request === request ? settled : undefined;
  return {
    items: shown?.items ?? [],
    total: shown?.total ?? 0,
    page: paging.page,
    pageSize: paging.pageSize,
    loading: !current,
    error: current?.error,
    setPage: useCallback(
      (page: number) => setPaging((value) => ({ ...value, page })),
      [],
    ),
    setPageSize: useCallback(
      (pageSize: number) =>
        setPaging((value) => ({ ...value, pageSize, page: 1 })),
      [],
    ),
    reload: useCallback(() => setVersion((value) => value + 1), []),
  };
}

/**
 * `useMailLogPage` for a list paged by token (`pageToken` in, `nextCursor` out), such as the Mail settings logs. Each
 * page's token is the one the page before it answered, so pages open one after another: `setPage` goes back to any
 * page already reached, or on to the next one. When newer rows move the pages, a page whose token went stale is fetched
 * again through the pages before it. A new `load` or page size starts over on the first page.
 */
export function useMailCursorLogPage<T>(
  load: (
    pageToken: string | undefined,
    pageSize: number,
  ) => Promise<MailPage<T>>,
): MailLogPage<T> {
  // The token that opens each page, by page size and page number, kept per `load`: new filters, new tokens. Only the
  // loader reads it. A token goes stale when the rows before it change; the pages reached stay reachable regardless,
  // since a page without a valid token is fetched through the pages before it.
  const tokenMapsRef = useRef(new WeakMap<typeof load, Map<string, string>>());
  // What rendering needs: the furthest page reached, by page size, and whether the shown page has a next one.
  const [known, setKnown] = useState<{
    readonly load: typeof load;
    readonly reached: ReadonlyMap<number, number>;
    readonly shown?: { readonly key: string; readonly hasNext: boolean };
  }>(() => ({ load, reached: new Map() }));
  if (known.load !== load) setKnown({ load, reached: new Map() });
  const byPage = useCallback(
    async (page: number, pageSize: number): Promise<MailOffsetPage<T>> => {
      let tokens = tokenMapsRef.current.get(load);
      if (!tokens) {
        tokens = new Map();
        tokenMapsRef.current.set(load, tokens);
      }
      const key = (number: number) => `${pageSize}:${number}`;
      // Records the token a page answered for the next one. A changed or missing token means the rows before it moved,
      // so every later page's token, which was derived from the old rows, is dropped and fetched again in order.
      const remember = (number: number, nextCursor: string | undefined) => {
        if (tokens.get(key(number + 1)) === nextCursor) return;
        for (const known of [...tokens.keys()]) {
          const [size, at] = known.split(':').map(Number);
          if (size === pageSize && at > number) tokens.delete(known);
        }
        if (nextCursor) tokens.set(key(number + 1), nextCursor);
      };
      // A page whose token is unknown is reached through the pages before it, from the furthest one still known.
      let from = page;
      while (from > 1 && !tokens.has(key(from))) from -= 1;
      let result = await load(
        from > 1 ? tokens.get(key(from)) : undefined,
        pageSize,
      );
      remember(from, result.nextCursor);
      while (from < page && result.nextCursor) {
        from += 1;
        result = await load(result.nextCursor, pageSize);
        remember(from, result.nextCursor);
      }
      // The list ended before the page asked for: that page is empty now.
      const reachedEnd = from < page;
      const furthest = reachedEnd ? from : page + (result.nextCursor ? 1 : 0);
      setKnown((current) =>
        current.load === load
          ? {
              load,
              reached: new Map(current.reached).set(
                pageSize,
                // Where the list ends now is known exactly; otherwise pages reached before stay reachable.
                reachedEnd || !result.nextCursor
                  ? furthest
                  : Math.max(current.reached.get(pageSize) ?? 1, furthest),
              ),
              shown: {
                key: `${pageSize}:${page}`,
                hasNext: !reachedEnd && Boolean(result.nextCursor),
              },
            }
          : current,
      );
      return {
        items: reachedEnd ? [] : result.items,
        total: result.total ?? result.items.length,
      };
    },
    [load],
  );
  const paged = useMailLogPage(byPage);
  const maxPage = known.reached.get(paged.pageSize) ?? 1;
  const { setPage } = paged;
  const clampedSetPage = useCallback(
    (page: number) => setPage(Math.max(1, Math.min(page, maxPage))),
    [maxPage, setPage],
  );
  return {
    ...paged,
    hasNext:
      known.shown?.key === `${paged.pageSize}:${paged.page}`
        ? known.shown.hasNext
        : false,
    maxPage,
    setPage: clampedSetPage,
  };
}

import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MAIL_PAGE_SIZE } from '../components/mail-pagination.js';
import { mailErrorMessage, type MailOffsetPage } from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export interface MailLogPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly loading: boolean;
  readonly error?: string;
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

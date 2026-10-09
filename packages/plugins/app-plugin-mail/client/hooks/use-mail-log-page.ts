import { useEffect, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  mailErrorMessage,
  type MailOffsetPage,
  type MailAccountView,
} from '../mail-client.js';
import { MAIL_PAGE_SIZE } from '../components/mail-pagination.js';

interface MailLogPage<T> {
  readonly page: number;
  readonly pageSize: number;
  readonly changePageSize: (size: number) => void;
  readonly changePage: (page: number) => void;
  readonly refresh: () => void;
  readonly accounts: readonly MailAccountView[];
  readonly rows: readonly T[];
  readonly hasNext: boolean;
  readonly total: number | undefined;
  readonly loading: boolean;
  readonly error?: string;
}

export function useMailLogPage<T>(
  load: (
    page: number,
    pageSize: number,
  ) => Promise<readonly [readonly MailAccountView[], MailOffsetPage<T>]>,
): MailLogPage<T> {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(MAIL_PAGE_SIZE);
  const [revision, setRevision] = useState(0);
  const [visiblePage, setVisiblePage] = useState({
    page: 1,
    pageSize: MAIL_PAGE_SIZE,
  });
  const [accounts, setAccounts] = useState<readonly MailAccountView[]>([]);
  const [rows, setRows] = useState<readonly T[]>([]);
  const [total, setTotal] = useState<number>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    void load(page, pageSize)
      .then(([nextAccounts, result]) => {
        const nextRows = result.items;
        if (!active) return;
        if (page > 1 && nextRows.length === 0)
          throw new Error(
            t('pagination.unavailable', {
              defaultValue:
                'This page has no records. Choose another page or refresh.',
            }),
          );
        setVisiblePage({ page, pageSize });
        setAccounts(nextAccounts);
        setRows(nextRows.slice(0, pageSize));
        setTotal(result.total);
        setHasNext(page * pageSize < result.total);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, page, pageSize, revision, t]);
  const refresh = () => {
    setLoading(true);
    setError(undefined);
    setRevision((value) => value + 1);
  };
  const changePage = (next: number) => {
    if (next === visiblePage.page || loading) return;
    setLoading(true);
    setError(undefined);
    setPageSize(visiblePage.pageSize);
    setPage(next);
    setRevision((value) => value + 1);
  };
  const changePageSize = (size: number) => {
    setLoading(true);
    setError(undefined);
    setPageSize(size);
    setPage(1);
    setRevision((value) => value + 1);
  };
  return {
    page: visiblePage.page,
    pageSize: visiblePage.pageSize,
    changePageSize,
    changePage,
    refresh,
    accounts,
    rows,
    hasNext,
    total,
    loading,
    error,
  };
}

import { useState } from 'react';
import { MAIL_PAGE_SIZE } from '../components/mail-pagination.js';

interface MailTablePage<T> {
  readonly rows: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasNext: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function useMailTablePage<T>(rows: readonly T[]): MailTablePage<T> {
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSize] = useState(MAIL_PAGE_SIZE);
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / pageSize)),
  );
  if (page !== requestedPage) setRequestedPage(page);
  return {
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: rows.length,
    hasNext: page * pageSize < rows.length,
    onPageChange: setRequestedPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setRequestedPage(1);
    },
  };
}

import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';

import type { CheckResult, DiskDescription } from '../../../server/storage.js';
import type { FileStorageView } from '../../../server/storage-schemas.js';
import type { FileUsageDescription } from '../../../server/usages.js';

export type { CheckResult, FileStorageView };
export type StorageDisk = DiskDescription & {
  readonly lastCheck: CheckResult | null;
};
export type StorageUsage = FileUsageDescription & {
  readonly stats: { readonly files: number; readonly bytes: number } | null;
};

export interface FileStorageState {
  readonly data: FileStorageView | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  readonly reload: () => void;
  readonly check: (disk: string) => Promise<CheckResult>;
}

/** Reads the file storage once on mount and again after each check, so the disk list shows the new result. */
export function useFileStorage(): FileStorageState {
  const api = useApiClient();
  const [reads, setReads] = useState(0);
  // The latest answer and the read it answers: the page is loading while a newer read is in flight.
  const [result, setResult] = useState<{
    readonly reads: number;
    readonly data?: FileStorageView;
    readonly error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    api.request<{ data: FileStorageView }>({ path: '/file/storage' }).then(
      (response) => {
        if (active) setResult({ reads, data: response.data });
      },
      (cause: unknown) => {
        if (active)
          setResult((previous) => ({
            reads,
            data: previous?.data,
            error: cause,
          }));
      },
    );
    return () => {
      active = false;
    };
  }, [api, reads]);
  const data = result?.data;
  const error = result?.error;
  const loading = result?.reads !== reads;
  const reload = useCallback(() => setReads((value) => value + 1), []);
  const check = useCallback(
    async (disk: string) => {
      const response = await api.request<{ data: CheckResult }>({
        method: 'POST',
        path: `/file/disks/${encodeURIComponent(disk)}/check`,
      });
      // The answer is this disk's new latest check: put it in place instead of reading the whole page again.
      const checked = response.data;
      setResult((previous) =>
        previous?.data
          ? {
              ...previous,
              data: {
                ...previous.data,
                disks: previous.data.disks.map((item) =>
                  item.name === checked.disk
                    ? { ...item, lastCheck: checked }
                    : item,
                ),
              },
            }
          : previous,
      );
      return checked;
    },
    [api],
  );
  return { data, error, loading, reload, check };
}

/** `1,284`, in the reader's locale. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** `3.2 GB`: binary units, one decimal from KB up. */
export function formatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit]}`;
}

/** `2 minutes ago`, in the reader's locale. */
export function formatAgo(
  iso: string,
  locale: string,
  now: number = Date.now(),
): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return format.format(seconds, 'second');
  if (abs < 3600) return format.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return format.format(Math.round(seconds / 3600), 'hour');
  return format.format(Math.round(seconds / 86400), 'day');
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Dropdown, Spin, theme } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useWorkflowTranslation } from '../locale';

export type JobSummary = {
  id: string | number;
  executionId: string | number;
  nodeId: string | number;
  status: number;
  updatedAt?: string;
};

export type JobHistoryPage = {
  items: JobSummary[];
  total?: number;
  snapshot: string;
  nextCursor: string | null;
};

export type JobHistoryCursor = { before?: string; snapshot?: string };

// Shared by v1 and v2. The caller supplies its API client and node presentation.
export function JobHistoryPopover({
  loadPage,
  onSelect,
  renderJob,
  children,
  menuClassName,
}: {
  loadPage: (cursor: JobHistoryCursor) => Promise<JobHistoryPage>;
  onSelect: (job: JobSummary) => void;
  renderJob: (job: JobSummary) => React.ReactNode;
  children: React.ReactElement;
  menuClassName?: string;
}) {
  const { t } = useWorkflowTranslation();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<JobSummary[]>([]);
  const [page, setPage] = useState<JobHistoryPage>();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function loadMore() {
    if (pending.current || (page && !page.nextCursor)) {
      return;
    }
    pending.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const result = await loadPage(page ? { before: page.nextCursor ?? undefined, snapshot: page.snapshot } : {});
      if (!active.current) {
        return;
      }
      setItems((previous) => {
        const known = new Set(previous.map((job) => String(job.id)));
        return [...previous, ...result.items.filter((job) => !known.has(String(job.id)))];
      });
      if (result.total != null) {
        setTotal(result.total);
      }
      setPage(result);
    } catch {
      if (active.current) {
        setFailed(true);
      }
    } finally {
      pending.current = false;
      if (active.current) {
        setLoading(false);
      }
    }
  }

  return (
    <Dropdown
      open={open}
      trigger={['hover', 'click']}
      onOpenChange={(visible, info) => {
        if (info.source === 'menu') return;
        setOpen(visible);
        if (visible && !page) {
          loadMore();
        }
      }}
      menu={{
        className: menuClassName,
        style: { maxHeight: 320, overflowY: 'auto' },
        items: [
          ...(page && total > 1
            ? [
                {
                  key: 'count',
                  disabled: true,
                  label: (
                    <span style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: token.fontSizeSM }}>
                      {t('Loaded {{loaded}} of {{total}} jobs', { loaded: items.length, total })}
                    </span>
                  ),
                },
              ]
            : []),
          ...items.map((job) => ({ key: String(job.id), label: renderJob(job) })),
          ...(!page || page.nextCursor
            ? [
                {
                  key: 'more',
                  disabled: loading,
                  label: (
                    <span style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: token.fontSizeSM }}>
                      {loading ? <Spin size="small" /> : failed ? t('Retry loading jobs') : t('Load more')}
                    </span>
                  ),
                },
              ]
            : []),
        ],
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          if (key === 'more') {
            loadMore();
            return;
          }
          const job = items.find((item) => String(item.id) === key);
          if (job) {
            onSelect(job);
            setOpen(false);
          }
        },
      }}
    >
      <span
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onFocus={() => {
          setOpen(true);
          if (!page) loadMore();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        {React.cloneElement(children, { 'aria-expanded': open, 'aria-label': t('View result') })}
      </span>
    </Dropdown>
  );
}

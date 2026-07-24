/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Input, List, Button, Tag, Typography } from 'antd';
import type { SnippetEntry } from '../runjsCompletions';

export const SnippetsDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  entries: SnippetEntry[];
  onInsert: (text: string) => void;
  tr: (s: string, o?: Record<string, unknown>) => string;
}> = ({ open, onClose, entries, onInsert, tr }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.prefix || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        ([...(s.groups || []), s.group].filter(Boolean).join(' ') || '').toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const groupDisplay = useMemo(() => {
    const map: Record<string, string> = {
      global: tr('Common'),
      libs: tr('Libs'),
      'scene/block': tr('Block'),
      'scene/detail': tr('Detail'),
      'scene/form': tr('Form'),
      'scene/table': tr('Table'),
    };
    return (group?: string) => (group ? map[group] || group : '');
  }, [tr]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-label={tr('Snippets')}
      role="dialog"
      style={{
        background: '#fff',
        borderRadius: 6,
        bottom: 0,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        left: 0,
        minHeight: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: 8,
          minHeight: 40,
          padding: '0 12px',
        }}
      >
        <Button aria-label={tr('Close')} icon={<CloseOutlined />} onClick={onClose} size="small" type="text" />
        <Typography.Text strong>{tr('Snippets')}</Typography.Text>
      </div>
      <div style={{ borderBottom: '1px solid #f0f0f0', padding: 12 }}>
        <Input
          placeholder={tr('Search snippets (name / prefix / body / group)')}
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <List
        dataSource={filtered}
        style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 12px' }}
        renderItem={(item) => {
          const groups = item.groups?.length ? item.groups : item.group ? [item.group] : [];
          return (
            <List.Item
              actions={[
                <Button
                  key="insert"
                  size="small"
                  type="primary"
                  onClick={() => {
                    const text = item.body.endsWith('\n') ? item.body : item.body + '\n';
                    onInsert(text);
                  }}
                >
                  {tr('Insert')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <>
                    <span>{item.name}</span>
                    {item.prefix ? <Tag style={{ marginLeft: 8 }}>{item.prefix}</Tag> : null}
                    {groups.map((grp) => (
                      <Tag color="blue" style={{ marginLeft: 8 }} key={grp}>
                        {groupDisplay(grp)}
                      </Tag>
                    ))}
                  </>
                }
                description={item.description || groupDisplay(groups[0]) || item.ref || ''}
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

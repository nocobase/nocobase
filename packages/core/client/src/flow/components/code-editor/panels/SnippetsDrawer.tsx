/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Drawer, Input, List, Button, Tag } from 'antd';
import type { SnippetEntry } from '../runjsCompletions';

export const SnippetsDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  getContainer: () => HTMLElement;
  entries: SnippetEntry[];
  onInsert: (text: string) => void;
  tr: (s: string, o?: any) => string;
}> = ({ open, onClose, getContainer, entries, onInsert, tr }) => {
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

  return (
    <Drawer
      title={tr('Snippets')}
      open={open}
      onClose={onClose}
      getContainer={getContainer}
      width={'100%'}
      destroyOnClose
    >
      <Input
        placeholder={tr('Search snippets (name / prefix / body / group)')}
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <List
        dataSource={filtered}
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
    </Drawer>
  );
};

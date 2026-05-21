/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Collapse, Empty, Space } from 'antd';
import type { CollapseProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

export interface ListCollapseProps<T> {
  value?: T[];
  onChange?: (value: T[]) => void;
  defaultValue?: T;
  addText: React.ReactNode;
  itemTitle: React.ReactNode;
  size?: CollapseProps['size'];
  bordered?: boolean;
  defaultOpenPanelCount?: number;
  renderHeader?: (item: T, index: number) => React.ReactNode;
  renderItem: (item: T, index: number) => React.ReactNode;
}

const toArray = <T,>(value?: T[]) => (Array.isArray(value) ? value : []);

export const rangeKeys = (count: number) => Array.from({ length: count }, (_, index) => String(index));

export const moveItem = <T,>(items: T[], from: number, to: number) => {
  const next = items.slice();
  const [current] = next.splice(from, 1);
  next.splice(to, 0, current);
  return next;
};

export const shiftKey = (key: string, from: number, to: number) => {
  const index = Number(key);

  if (Number.isNaN(index)) {
    return key;
  }

  if (index === from) {
    return String(to);
  }

  if (from < to && index > from && index <= to) {
    return String(index - 1);
  }

  if (from > to && index >= to && index < from) {
    return String(index + 1);
  }

  return key;
};

export const shiftKeysAfterRemove = (keys: string[], removedIndex: number, nextLength: number) =>
  keys
    .filter((key) => Number(key) !== removedIndex)
    .map((key) => {
      const index = Number(key);
      return index > removedIndex ? String(index - 1) : key;
    })
    .filter((key) => Number(key) < nextLength);

export const ListCollapse = <T,>({
  value,
  onChange,
  defaultValue,
  addText,
  itemTitle,
  size = 'small',
  bordered = true,
  defaultOpenPanelCount = 5,
  renderHeader,
  renderItem,
}: ListCollapseProps<T>) => {
  const items = toArray(value);
  const [activeKeys, setActiveKeys] = useState<string[]>(() =>
    rangeKeys(Math.min(items.length, defaultOpenPanelCount)),
  );

  useEffect(() => {
    setActiveKeys((current) => {
      const next = current.filter((key) => Number(key) < items.length);
      if (next.length > 0 || items.length === 0) {
        return next;
      }
      return rangeKeys(Math.min(items.length, defaultOpenPanelCount));
    });
  }, [defaultOpenPanelCount, items.length]);

  const collapseItems = useMemo<CollapseProps['items']>(
    () =>
      items.map((item, index) => ({
        key: String(index),
        label: renderHeader ? renderHeader(item, index) : `${itemTitle} ${index + 1}`,
        extra: (
          <Space size={4} onClick={(event) => event.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<UpOutlined />}
              disabled={index === 0}
              onClick={() => {
                if (index === 0) {
                  return;
                }
                onChange?.(moveItem(items, index, index - 1));
                setActiveKeys((current) => current.map((key) => shiftKey(key, index, index - 1)));
              }}
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              disabled={index === items.length - 1}
              onClick={() => {
                if (index === items.length - 1) {
                  return;
                }
                onChange?.(moveItem(items, index, index + 1));
                setActiveKeys((current) => current.map((key) => shiftKey(key, index, index + 1)));
              }}
            />
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                const next = items.filter((_, itemIndex) => itemIndex !== index);
                onChange?.(next);
                setActiveKeys((current) => shiftKeysAfterRemove(current, index, next.length));
              }}
            />
          </Space>
        ),
        children: renderItem(item, index),
        forceRender: true,
      })),
    [itemTitle, items, onChange, renderHeader, renderItem],
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {items.length > 0 ? (
        <Collapse
          size={size}
          bordered={bordered}
          activeKey={activeKeys}
          items={collapseItems}
          onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys.map(String) : [String(keys)])}
        />
      ) : (
        <Empty style={{ border: ' 1px dashed #ccc', padding: '16px', margin: 0, borderRadius: 10 }} />
      )}
      <Button
        block
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => {
          const next = items.concat(defaultValue as T);
          onChange?.(next);
          setActiveKeys((current) => Array.from(new Set(current.concat(String(next.length - 1)))));
        }}
      >
        {addText}
      </Button>
    </Space>
  );
};

export default ListCollapse;

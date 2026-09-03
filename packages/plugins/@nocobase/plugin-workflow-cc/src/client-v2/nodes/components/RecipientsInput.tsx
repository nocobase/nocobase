/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, HolderOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { UserSelect } from '@nocobase/plugin-notification-manager/client-v2';
import { useMemoizedFn } from 'ahooks';
import { Button, Flex, Popover, Space, theme } from 'antd';
import React, { useState } from 'react';

import { useT } from '../../locale';

export type RecipientValue = number | string | { filter?: Record<string, unknown> };

export interface RecipientsInputProps {
  disabled?: boolean;
  onChange?: (value: RecipientValue[]) => void;
  value?: RecipientValue[];
}

function RecipientsAddition({
  disabled,
  onChange,
  value = [],
}: {
  disabled?: boolean;
  onChange?: (value: RecipientValue[]) => void;
  value?: RecipientValue[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const append = useMemoizedFn((item: string | { filter?: Record<string, unknown> }) => {
    onChange?.([...value, item]);
    setOpen(false);
  });

  const button = (
    <Button block disabled={disabled} icon={<PlusOutlined />} type="dashed">
      {t('Add')}
    </Button>
  );

  if (disabled) {
    return null;
  }

  return (
    <Popover
      content={
        <Space direction="vertical" size="small">
          <Button type="text" onClick={() => append('')}>
            {t('Select users')}
          </Button>
          <Button type="text" onClick={() => append({ filter: {} })}>
            {t('Query users')}
          </Button>
        </Space>
      }
      onOpenChange={setOpen}
      open={open}
      placement="bottom"
    >
      {button}
    </Popover>
  );
}

function RecipientRow({
  disabled,
  index,
  item,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdate,
  total,
}: {
  disabled?: boolean;
  index: number;
  item: RecipientValue;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdate: (next: RecipientValue) => void;
  total: number;
}) {
  const { token } = theme.useToken();
  const t = useT();

  return (
    <Flex gap="small" align="center">
      <Button
        aria-label={t('Sort recipient')}
        disabled
        icon={<HolderOutlined />}
        size="small"
        style={{
          color: token.colorTextTertiary,
          cursor: 'grab',
          height: token.controlHeight,
          minWidth: token.fontSizeLG,
          paddingInline: 0,
          width: token.fontSizeLG,
        }}
        type="text"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <UserSelect value={item} onChange={onUpdate} />
      </div>
      {disabled ? null : (
        <>
          <Button
            aria-label={t('Move recipient up')}
            disabled={index === 0}
            icon={<UpOutlined />}
            onClick={onMoveUp}
            style={{
              color: token.colorTextTertiary,
              height: token.controlHeight,
              minWidth: token.controlHeightSM,
              paddingInline: 0,
              width: token.controlHeightSM,
            }}
            type="text"
          />
          <Button
            aria-label={t('Move recipient down')}
            disabled={index === total - 1}
            icon={<DownOutlined />}
            onClick={onMoveDown}
            style={{
              color: token.colorTextTertiary,
              height: token.controlHeight,
              minWidth: token.controlHeightSM,
              paddingInline: 0,
              width: token.controlHeightSM,
            }}
            type="text"
          />
          <Button
            aria-label={t('Remove recipient')}
            icon={<DeleteOutlined />}
            onClick={onRemove}
            style={{
              color: token.colorTextTertiary,
              height: token.controlHeight,
              minWidth: token.controlHeightSM,
              paddingInline: 0,
              width: token.controlHeightSM,
            }}
            type="text"
          />
        </>
      )}
    </Flex>
  );
}

export function RecipientsInput({ disabled, onChange, value = [] }: RecipientsInputProps) {
  const { token } = theme.useToken();
  const update = useMemoizedFn((index: number, next: RecipientValue) => {
    onChange?.(value.map((item, currentIndex) => (currentIndex === index ? next : item)));
  });
  const updateAll = useMemoizedFn((nextValue: RecipientValue[]) => {
    onChange?.(nextValue);
  });
  const remove = useMemoizedFn((index: number) => {
    onChange?.(value.filter((_item, currentIndex) => currentIndex !== index));
  });
  const move = useMemoizedFn((from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange?.(next);
  });

  return (
    <Flex vertical>
      {value.length ? (
        <Flex vertical gap="small" style={{ marginBottom: token.marginLG }}>
          {value.map((item, index) => (
            <RecipientRow
              key={`${index}`}
              disabled={disabled}
              index={index}
              item={item}
              onMoveDown={() => move(index, index + 1)}
              onMoveUp={() => move(index, index - 1)}
              onRemove={() => remove(index)}
              onUpdate={(next) => update(index, next)}
              total={value.length}
            />
          ))}
        </Flex>
      ) : null}
      <RecipientsAddition value={value} onChange={updateAll} disabled={disabled} />
    </Flex>
  );
}

export default RecipientsInput;

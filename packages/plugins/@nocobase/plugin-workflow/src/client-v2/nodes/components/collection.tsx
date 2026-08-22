/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { Form } from 'antd';
import { CollectionCascader } from '../../components/collection';
import { useT } from '../../locale';

type CollectionChangedHandler = (previous: string, next?: string) => void;

function ResettingCollectionCascader({
  value,
  onChange,
  disabled,
  onCollectionChanged,
}: {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  onCollectionChanged?: CollectionChangedHandler;
}) {
  const prevCollection = useRef<string | undefined>();

  return (
    <CollectionCascader
      value={value}
      disabled={disabled}
      onChange={(collection) => {
        const previous = prevCollection.current ?? value;
        onChange?.(collection);
        if (previous && previous !== collection) {
          onCollectionChanged?.(previous, collection);
        }
        prevCollection.current = collection;
      }}
    />
  );
}

export function NodeCollectionField({
  disabled,
  onCollectionChanged,
}: {
  disabled?: boolean;
  onCollectionChanged?: CollectionChangedHandler;
}) {
  const t = useT();

  return (
    <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
      <ResettingCollectionCascader disabled={disabled} onCollectionChanged={onCollectionChanged} />
    </Form.Item>
  );
}

export default NodeCollectionField;

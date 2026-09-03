/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { useNodeContext } from '../../canvas/contexts';
import { NodeCollectionField } from './collection';
import { NodeFilterField } from './filter';

function DestroyFields() {
  const collection = Form.useWatch(['config', 'collection']);

  if (!collection) {
    return null;
  }

  return <NodeFilterField collection={collection} />;
}

export function DestroyFieldset() {
  const node = useNodeContext();
  const form = Form.useFormInstance();

  return (
    <>
      <NodeCollectionField
        disabled={Boolean(node?.config?.collection)}
        onCollectionChanged={() => {
          form.setFieldValue(['config', 'params', 'filter'], {});
        }}
      />
      <DestroyFields />
    </>
  );
}

export function DestroyPresetFieldset() {
  return <NodeCollectionField />;
}

export default DestroyFieldset;

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { EllipsisWithTooltip, useCollection, useFieldTitle, useFlag } from '@nocobase/client';
import React from 'react';
import { MapComponent } from './MapComponent';

const ReadPretty = (props) => {
  const { value } = props;
  const fieldSchema = useFieldSchema();
  const collection = useCollection();
  const collectionField = collection.getField(fieldSchema.name);
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  const { isInSubTable } = useFlag();
  const displayText = fieldSchema?.parent?.['x-component'] === 'TableV2.Column' || isInSubTable;
  useFieldTitle();
  if (displayText) {
    return (
      <div>
        <EllipsisWithTooltip ellipsis={true}>
          {value?.map?.((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',')}
        </EllipsisWithTooltip>
      </div>
    );
  }

  return <MapComponent readonly mapType={mapType} {...props}></MapComponent>;
};

export default ReadPretty;

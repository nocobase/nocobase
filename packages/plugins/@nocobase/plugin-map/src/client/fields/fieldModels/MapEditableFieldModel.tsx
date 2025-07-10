/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@nocobase/client';
import { EditableFieldModel } from '@nocobase/client';
import { connect, mapReadPretty } from '@formily/react';
import { MapComponent } from '../../components/MapComponent';
import React from 'react';
import { PointReadPretty } from './MapReadPrettyFieldModel';

const className = css`
  height: 100%;
  border: 1px solid transparent;
  .ant-formily-item-error & {
    border: 1px solid #ff4d4f;
  }
`;

const InternalMap = connect((props) => {
  return (
    <div className={className}>
      <MapComponent {...props} />
    </div>
  );
}, mapReadPretty(PointReadPretty));

export class MapEditableFieldModel extends EditableFieldModel {
  getMapFieldType() {
    return null;
  }
  get component() {
    return [
      InternalMap,
      {
        type: this.getMapFieldType(),
      },
    ];
  }
}

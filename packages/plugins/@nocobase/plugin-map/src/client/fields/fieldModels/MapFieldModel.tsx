/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { escapeT, largeField } from '@nocobase/flow-engine';
import { css, FormFieldModel } from '@nocobase/client';
import React from 'react';
import { MapComponent } from './MapComponent';

const className = css`
  height: 100%;
  border: 1px solid transparent;
  .ant-formily-item-error & {
    border: 1px solid #ff4d4f;
  }
`;

const InternalMap = (props) => {
  return (
    <div className={className}>
      <MapComponent {...props} />
    </div>
  );
};

@largeField()
export class MapFieldModel extends FormFieldModel {
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

MapFieldModel.registerFlow({
  key: 'mapFieldSetting',
  title: escapeT('Map field setting'),
  sort: 500,
  steps: {
    zoom: {
      use: 'setDefaultZoomLevel',
      handler(ctx, params) {
        ctx.model.setProps({
          zoom: params.zoom,
        });
      },
    },
  },
});

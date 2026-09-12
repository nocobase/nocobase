/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { largeField } from '@nocobase/flow-engine';
import { FieldModel } from '@nocobase/client-v2';
import React from 'react';
import { MapComponent } from '../MapComponent';
import { tExpr } from '../../locale';

const InternalMap = (props) => {
  return (
    <div style={{ height: '100%' }}>
      <MapComponent {...props} />
    </div>
  );
};

@largeField()
export class MapFieldModel extends FieldModel {
  getMapFieldType() {
    return null;
  }
  render() {
    return <InternalMap {...this.props} type={this.getMapFieldType()} />;
  }
}

MapFieldModel.registerFlow({
  key: 'mapFieldSetting',
  title: tExpr('Map field settings'),
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

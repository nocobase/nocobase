/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel, TableColumnModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { MapComponent } from '../MapComponent';
import { NAMESPACE } from '../../locale';

export const PointReadPretty = (props) => {
  const { displayStyle = 'text', value, collectionField, type } = props;
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  if (displayStyle === 'text') {
    return value?.map?.((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',');
  }
  return <MapComponent readonly disabled mapType={mapType} {...props} type={type}></MapComponent>;
};
export class DisplayMapFieldModel extends FieldModel {
  getMapFieldType() {
    return null;
  }

  public render() {
    const { value } = this.props;
    return (
      <PointReadPretty
        {...this.props}
        value={value}
        collectionField={this.context.collectionField}
        type={this.getMapFieldType()}
      />
    );
  }
}

DisplayMapFieldModel.registerFlow({
  key: 'mapFieldSetting',
  title: tExpr('Map field settings', { ns: NAMESPACE }),
  steps: {
    displayStyle: {
      title: tExpr('Display style'),
      uiSchema: (ctx) => {
        if (ctx.model.parent instanceof TableColumnModel) {
          return null;
        }
        return {
          displayStyle: {
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
              { label: tExpr('Text'), value: 'text' },
              { label: tExpr('Map'), value: 'map' },
            ],
          },
        };
      },
      defaultParams: {
        displayStyle: 'text',
      },
      handler(ctx, params) {
        ctx.model.setProps({ displayStyle: params.displayStyle });
      },
    },
    zoom: {
      use: 'setDefaultZoomLevel',
    },
  },
});

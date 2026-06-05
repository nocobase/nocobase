/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DisplayTitleFieldModel, TableColumnModel } from '@nocobase/client';
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
export class DisplayMapFieldModel extends DisplayTitleFieldModel {
  getMapFieldType() {
    return null;
  }

  public renderComponent(value) {
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
      title: tExpr('Display mode'),
      uiMode(ctx) {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'displayStyle',
          props: {
            options: [
              { label: t('Text'), value: 'text' },
              { label: t('Map'), value: 'map' },
            ],
          },
        };
      },
      hideInSettings(ctx) {
        if (ctx.model.parent instanceof TableColumnModel) {
          return true;
        }
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
      hideInSettings(ctx) {
        const displayStyle = ctx.model.getStepParams?.('mapFieldSetting', 'displayStyle')?.displayStyle;
        return displayStyle === 'text';
      },
    },
  },
});

DisplayMapFieldModel.registerFlow({
  key: 'displayFieldSettings',
  title: tExpr('Display Field settings'),
  sort: 200,
  steps: {
    overflowMode: {
      use: 'overflowMode',
      hideInSettings(ctx) {
        const displayStyle = ctx.model.getStepParams?.('mapFieldSetting', 'displayStyle')?.displayStyle;
        return displayStyle === 'map';
      },
    },
  },
});

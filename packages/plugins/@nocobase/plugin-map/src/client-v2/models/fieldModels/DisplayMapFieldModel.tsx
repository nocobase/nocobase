/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DisplayTitleFieldModel, TableColumnModel } from '@nocobase/client-v2';
import { css } from '@emotion/css';
import { Typography } from 'antd';
import { MapComponent } from '../MapComponent';
import { tExpr } from '../../locale';

export const formatMapDisplayValue = (value: any) => {
  return value?.map?.((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',');
};

export const PointReadPretty = (props) => {
  const { displayStyle = 'text', value, collectionField, type } = props;
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  if (displayStyle === 'text') {
    return formatMapDisplayValue(value);
  }
  return <MapComponent readonly disabled mapType={mapType} {...props} type={type}></MapComponent>;
};
export class DisplayMapFieldModel extends DisplayTitleFieldModel {
  getMapFieldType() {
    return null;
  }

  render(): any {
    const { value, displayStyle, overflowMode, width, style, className } = this.props;

    if (displayStyle === 'map') {
      return this.renderComponent(value);
    }

    return (
      <Typography.Text
        className={className}
        ellipsis={
          overflowMode === 'ellipsis'
            ? {
                tooltip: {
                  rootClassName: css`
                    .ant-tooltip-inner {
                      color: #000;
                      max-height: 500px;
                      overflow-y: auto;
                      padding: 10px;
                    }
                  `,
                  color: '#fff',
                },
              }
            : false
        }
        style={{
          ...(style || {}),
          whiteSpace: overflowMode === 'wrap' ? 'normal' : 'nowrap',
          width: width || 'auto',
        }}
      >
        {this.renderComponent(value)}
      </Typography.Text>
    );
  }

  renderInDisplayStyle() {
    return this.renderComponent(this.props.value);
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
  title: tExpr('Map field settings'),
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

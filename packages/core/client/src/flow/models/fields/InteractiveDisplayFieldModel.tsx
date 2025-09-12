/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { escapeT } from '@nocobase/flow-engine';
import { FieldModel } from '../base/FieldModel';

export interface InteractiveDisplayProps {
  clickToOpen?: boolean; // 是否允许点击打开
  displayStyle?: 'default' | 'link' | 'tag';
}

export class InteractiveDisplayFieldModel extends FieldModel {
  /**
   * 可选：点击打开行为
   */
  set onClick(fn) {
    this.setProps({ ...this.props, onClick: fn });
  }

  renderDisplayValue(value) {
    return value;
  }
  /**
   * 基类统一渲染逻辑
   */
  render(): any {
    return ({ value }) => {
      if (value == null || value === '') return null;

      const display = this.renderDisplayValue(value);

      const wrapped = (
        <span
          style={{
            cursor: this.props.clickToOpen ? 'pointer' : 'default',
            userSelect: 'text',
          }}
          onClick={() => this.props.onClick(value)}
        >
          {display}
        </span>
      );

      switch (this.props.displayStyle) {
        case 'link':
          return <a onClick={() => this.props.onClick(value)}>{display}</a>;
        case 'tag':
          return <span className="ant-tag">{display}</span>;
        default:
          return wrapped;
      }
    };
  }
}

InteractiveDisplayFieldModel.registerFlow({
  key: 'displayFieldSettings',
  title: escapeT('Display Field settings'),
  sort: 200,
  steps: {
    displayStyle: {
      title: escapeT('Display style'),
      uiSchema: {
        displayStyle: {
          'x-component': 'Radio.Group',
          'x-decorator': 'FormItem',
          enum: [
            { label: escapeT('Tag'), value: 'tag' },
            { label: escapeT('Text'), value: 'text' },
          ],
        },
      },
      defaultParams: {
        displayStyle: 'text',
      },
      handler(ctx, params) {
        ctx.model.setProps({ displayStyle: params.displayStyle });
      },
    },
    clickToOpen: {
      title: escapeT('Enable click to open'),
      uiSchema: {
        clickToOpen: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        clickToOpen: true,
      },
      handler(ctx, params) {
        ctx.model.onClick = (e, currentRecord, parentRecord) => {
          const sourceCollection = ctx.blockModel.collection;
          const targetCollection = ctx.model.collectionField.targetCollection;
          const sourceKey = ctx.model.collectionField.sourceKey || sourceCollection.filterTargetKey;
          const targetKey = ctx.model.collectionField.targetKey;
          if (!targetCollection || !currentRecord) {
            return;
          }
          ctx.model.dispatchEvent('click', {
            event: e,
            filterByTk: currentRecord[targetKey],
            collectionName: targetCollection.name,
            associationName: `${sourceCollection.name}.${ctx.model.collectionField.name}`,
            sourceId: parentRecord[sourceKey],
          });
        };
        ctx.model.setProps({ clickToOpen: params.clickToOpen });
      },
    },
  },
});

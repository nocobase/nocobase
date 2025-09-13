/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { escapeT } from '@nocobase/flow-engine';
import { castArray } from 'lodash';

import { FieldModel } from '../base/FieldModel';
import { updateOpenViewStepParams, openViewFlow } from '../../flows/openViewFlow';

export interface InteractiveDisplayProps {
  clickToOpen?: boolean; // 是否允许点击打开
  displayStyle?: 'text' | 'tag';
}

export class InteractiveDisplayFieldModel extends FieldModel {
  onInit(options) {
    super.onInit(options);

    const sourceCollection = this.context.blockModel?.collection;
    const targetCollection = this.collectionField?.targetCollection;

    let params;

    if (this.collectionField?.isAssociationField()) {
      params = {
        collectionName: targetCollection?.name,
        associationName:
          sourceCollection?.name && this.collectionField?.name
            ? `${sourceCollection.name}.${this.collectionField.name}`
            : undefined,
        dataSourceKey: targetCollection?.dataSourceKey,
      };
    } else {
      params = {
        collectionName: this.context.collection?.name,
        associationName: this.collectionField?.target,
        dataSourceKey: this.context.collection?.dataSourceKey,
      };
    }

    updateOpenViewStepParams(params, this);
  }

  /**
   * 点击打开行为
   */
  onClick(event, currentRecord) {
    if (this.collectionField.isAssociationField()) {
      const targetCollection = this.collectionField.targetCollection;
      const sourceCollection = this.context.blockModel.collection;
      const sourceKey = this.collectionField.sourceKey || sourceCollection.filterTargetKey;
      const targetKey = this.collectionField?.targetKey;

      this.dispatchEvent('click', {
        event,
        filterByTk: currentRecord[targetKey],
        collectionName: targetCollection.name,
        associationName: `${sourceCollection.name}.${this.collectionField.name}`,
        sourceId: this.context.record[sourceKey],
      });
    } else {
      this.dispatchEvent('click', {
        event,
        sourceId: this.context.resource?.getSourceId(),
        filterByTk: this.context.collection.getFilterByTK(this.context.record),
      });
    }
  }

  renderDisplayValue(value) {
    return value;
  }

  renderInDisplayStyle(value, record?) {
    const { clickToOpen = false, displayStyle, titleField, ...restProps } = this.props;
    const result = this.renderDisplayValue(value);
    const display = record ? (value ? result : 'N/A') : result;
    const isTag = displayStyle === 'tag';
    const handleClick = (e) => {
      clickToOpen && this.onClick(e, record);
    };
    const commonStyle = {
      cursor: clickToOpen ? 'pointer' : 'default',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    };
    if (isTag) {
      return (
        <Tag {...restProps} style={commonStyle} onClick={handleClick}>
          {display}
        </Tag>
      );
    }
    if (clickToOpen) {
      return (
        <a {...restProps} style={commonStyle} onClick={handleClick}>
          {display}
        </a>
      );
    }

    return (
      <span {...restProps} style={commonStyle} className={restProps.className}>
        {display}
      </span>
    );
  }

  /**
   * 基类统一渲染逻辑
   */
  render(): any {
    const { value, displayStyle, titleField } = this.props;
    if (titleField) {
      if (displayStyle === 'tag') {
        return castArray(value).map((v, idx) => (
          <React.Fragment key={idx}>{this.renderInDisplayStyle(v?.[titleField], v)}</React.Fragment>
        ));
      } else {
        return castArray(value).flatMap((v, idx) => {
          const node = this.renderInDisplayStyle(v?.[titleField], v);
          return idx === 0 ? [node] : [<span key={`sep-${idx}`}>, </span>, node];
        });
      }
    } else {
      return this.renderInDisplayStyle(value);
    }
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
      defaultParams: (ctx) => {
        return {
          clickToOpen: ctx.collectionField.isAssociationField(),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ clickToOpen: params.clickToOpen });
      },
    },
  },
});
InteractiveDisplayFieldModel.registerFlow(openViewFlow);

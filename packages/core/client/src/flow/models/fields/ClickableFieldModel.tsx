/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, tExpr } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { castArray } from 'lodash';
import React from 'react';
import { openViewFlow } from '../../flows/openViewFlow';
import { FieldModel } from '../base';
import { EllipsisWithTooltip } from '../../components';

export function transformNestedData(inputData) {
  const resultArray = [];

  function recursiveTransform(data) {
    if (data?.parent) {
      const { parent } = data;
      recursiveTransform(parent);
    }
    const { parent, ...other } = data;
    resultArray.push(other);
  }
  if (inputData) {
    recursiveTransform(inputData);
  }
  return resultArray;
}

export class ClickableFieldModel extends FieldModel {
  get collectionField(): CollectionField {
    return this.context.collectionField;
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

  renderComponent(value) {
    return value;
  }

  renderInDisplayStyle(value, record?, isToMany?) {
    const { clickToOpen = false, displayStyle, titleField, overflowMode, ...restProps } = this.props;
    if (value && typeof value === 'object' && restProps.target) {
      return;
    }
    const result = this.renderComponent(value);
    const display = record ? (value ? result : 'N/A') : result;
    const isTag = displayStyle === 'tag';
    const handleClick = (e) => {
      clickToOpen && this.onClick(e, record);
    };

    const commonStyle = {
      cursor: clickToOpen ? 'pointer' : 'default',
      alignItems: 'center',
      gap: 4,
      display: isToMany && 'inline-block',
    };

    if (isTag) {
      return (
        value && (
          <Tag {...restProps} style={commonStyle} onClick={handleClick}>
            {display}
          </Tag>
        )
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
    const { value, displayStyle, fieldNames, overflowMode } = this.props;
    const titleField = this.props.titleField || fieldNames?.label;
    const ellipsis = overflowMode === 'ellipsis';
    if (titleField) {
      if (displayStyle === 'tag') {
        const result = castArray(value).map((v, idx) => (
          <React.Fragment key={idx}>{this.renderInDisplayStyle(v?.[titleField], v)}</React.Fragment>
        ));
        return <EllipsisWithTooltip ellipsis={ellipsis}>{result}</EllipsisWithTooltip>;
      } else {
        const result = castArray(value).flatMap((v, idx) => {
          if (this.collectionField.targetCollection?.template === 'tree') {
            const label = transformNestedData(v).length
              ? transformNestedData(v)
                  .map((o) => o?.[titleField])
                  .join(' / ')
              : null;
            const node = this.renderInDisplayStyle(label, v, Array.isArray(value));
            return idx === 0 ? [node] : [<span key={`sep-${idx}`}>, </span>, node];
          } else {
            const node = this.renderInDisplayStyle(v?.[titleField], v, Array.isArray(value));
            return idx === 0 ? [node] : [<span key={`sep-${idx}`}>, </span>, node];
          }
        });
        return (
          <EllipsisWithTooltip ellipsis={ellipsis}>
            <span style={{ flexWrap: 'nowrap' }}>{result}</span>
          </EllipsisWithTooltip>
        );
      }
    } else {
      const textContent = (
        <EllipsisWithTooltip ellipsis={ellipsis}>{this.renderInDisplayStyle(value)}</EllipsisWithTooltip>
      );
      return textContent;
    }
  }
}

ClickableFieldModel.registerFlow({
  key: 'displayFieldSettings',
  title: tExpr('Display Field settings'),
  sort: 200,
  steps: {
    displayStyle: {
      title: tExpr('Display style'),
      uiSchema: (ctx) => {
        if (['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'].includes(ctx.collectionField?.interface)) {
          return null;
        }

        return {
          displayStyle: {
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
              { label: tExpr('Tag'), value: 'tag' },
              { label: tExpr('Text'), value: 'text' },
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
    clickToOpen: {
      title: tExpr('Enable click to open'),
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
        ctx.model.setProps({ clickToOpen: params.clickToOpen, ...ctx.collectionField.getComponentProps() });
      },
    },
    overflowMode: {
      title: tExpr('Content overflow display mode'),
      use: 'overflowMode',
    },
  },
});
ClickableFieldModel.registerFlow(openViewFlow);

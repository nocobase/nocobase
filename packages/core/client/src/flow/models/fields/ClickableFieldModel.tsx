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
import { castArray, get } from 'lodash';
import React from 'react';
import { EllipsisWithTooltip } from '../../components';
import { openViewFlow } from '../../flows/openViewFlow';
import { FieldModel } from '../base';
import { EditFormModel } from '../blocks/form/EditFormModel';

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

const hasAssociationPathName = (parent: unknown): parent is { associationPathName?: string } =>
  !!parent && typeof parent === 'object' && 'associationPathName' in parent;

export class ClickableFieldModel extends FieldModel {
  get collectionField(): CollectionField {
    return this.context.collectionField;
  }

  /**
   * 点击打开行为
   */
  onClick(event, currentRecord) {
    const associationPathName = hasAssociationPathName(this.parent) ? this.parent.associationPathName : undefined;

    if (this.collectionField.isAssociationField()) {
      const targetCollection = this.collectionField.targetCollection;
      const sourceCollection = this.context.blockModel.collection;
      const sourceKey = this.collectionField.sourceKey || sourceCollection.filterTargetKey;
      const targetKey = this.collectionField?.targetKey;

      let filterByTk = currentRecord[targetKey];
      if (this.collectionField.interface === 'm2m') {
        // if use currentRecord[targetKey], details block in the popup will throw error
        // also incorrect for v1
        filterByTk = currentRecord[targetCollection.filterTargetKey];
      }
      const parentObj = associationPathName
        ? get(this.context.blockModel?.form?.getFieldsValue?.(true) || this.context.record, associationPathName)
        : this.context.record;
      this.dispatchEvent(
        'click',
        {
          event,
          filterByTk,
          collectionName: this.collectionField.collection.name,
          associationName: `${sourceCollection.name}.${this.collectionField.name}`, // `${sourceCollection.name}.${this.collectionField.name}`,
          sourceId: parentObj[sourceKey],
        },
        {
          debounce: true,
        },
      );
      return;
    }

    if (associationPathName) {
      // 关联字段的属性
      const collection = this.context.collection;
      const associationField = collection?.getFieldByPath?.(associationPathName);
      if (associationField?.isAssociationField?.()) {
        const targetCollection = associationField.targetCollection;
        const sourceCollection = associationField.collection;
        const sourceKey = associationField.sourceKey || sourceCollection?.filterTargetKey;
        const targetKey = associationField?.targetKey || targetCollection?.filterTargetKey;
        const associationRecord = currentRecord ?? get(this.context.record, associationPathName);
        const associationParentField = associationPathName.includes('.')
          ? collection.getFieldByPath(associationPathName.split('.')[0])
          : null;
        const foreignKey = associationParentField?.foreignKey;
        const parentObj = associationPathName.includes('.')
          ? get(this.context.record, associationPathName.split('.')[0])
          : this.context.record;
        let filterByTk = associationRecord?.[targetKey];
        if (associationField.interface === 'm2m') {
          // also incorrect for v1
          filterByTk = associationRecord?.[targetCollection.filterTargetKey];
        }

        this.dispatchEvent(
          'click',
          {
            event,
            filterByTk,
            collectionName: this.collectionField.collection.name,
            associationName: `${associationField.collection.name}.${this.collectionField.name}`,
            // list api， 如果append了关系字段的某个属性，它并不会将关系字段对应的 filterByTk (sourceKey) 属性值返回， 但是会返回foriegnKey对应的值
            sourceId: parentObj[sourceKey] || this.context.record[foreignKey],
          },
          {
            debounce: true,
          },
        );
        return;
      }
    }

    this.dispatchEvent(
      'click',
      {
        event,
        sourceId: this.context.resource?.getSourceId(),
        filterByTk: this.context.collection.getFilterByTK(this.context.item?.value || this.context.record),
      },
      {
        debounce: true,
      },
    );
  }

  renderComponent(value, wrap?) {
    return value;
  }

  renderInDisplayStyle(value, record?, isToMany?, wrap?) {
    const { clickToOpen = false, displayStyle, titleField, overflowMode, disabled, ...restProps } = this.props;
    if (value && typeof value === 'object' && restProps.target) {
      return;
    }
    const result = this.renderComponent(value, wrap);
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
        <EllipsisWithTooltip ellipsis={ellipsis} popoverContent={this.renderInDisplayStyle(value, null, null, true)}>
          {this.renderInDisplayStyle(value)}
        </EllipsisWithTooltip>
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
      title: tExpr('Display mode'),
      uiMode: (ctx) => {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'displayStyle',
          props: {
            options: [
              { label: t('Tag'), value: 'tag' },
              { label: t('Text'), value: 'text' },
            ],
          },
        };
      },
      hideInSettings: async (ctx) => {
        if (['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'].includes(ctx.collectionField?.interface)) {
          return true;
        }
        return false;
      },
      defaultParams: {
        displayStyle: 'text',
      },
      handler(ctx, params) {
        ctx.model.setProps({ displayStyle: params.displayStyle });
      },
    },

    overflowMode: {
      use: 'overflowMode',
    },
    clickToOpen: {
      title: tExpr('Enable click-to-open'),
      uiMode: { type: 'switch', key: 'clickToOpen' },
      defaultParams: (ctx) => {
        if (ctx.disableFieldClickToOpen) {
          return {
            clickToOpen: false,
          };
        }
        return {
          clickToOpen: ctx.collectionField.isAssociationField(),
        };
      },
      hideInSettings(ctx) {
        return ctx.disableFieldClickToOpen;
      },
      handler(ctx, params) {
        ctx.model.setProps({ clickToOpen: params.clickToOpen, ...ctx.collectionField.getComponentProps() });
      },
    },
  },
});
ClickableFieldModel.registerFlow(openViewFlow);

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, escapeT } from '@nocobase/flow-engine';
import { Tag, Typography } from 'antd';
import { castArray } from 'lodash';
import { css } from '@emotion/css';
import React from 'react';
import { openViewFlow } from '../../flows/openViewFlow';
import { FieldModel } from '../base';

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

  renderInDisplayStyle(value, record?) {
    const { clickToOpen = false, displayStyle, titleField, overflowMode, ...restProps } = this.props;
    if (typeof value === 'object' && restProps.target) {
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
    const { value, displayStyle, fieldNames, overflowMode, width } = this.props;
    const titleField = this.props.titleField || fieldNames?.label;
    const typographyProps = {
      ellipsis:
        overflowMode === 'ellipsis'
          ? {
              tooltip: {
                rootClassName: css`
                  .ant-tooltip-inner {
                    color: #000;
                  }
                `,
                color: '#fff',
              },
            }
          : false, // 处理省略显示
      style: {
        whiteSpace: overflowMode === 'wrap' ? 'normal' : 'nowrap', // 控制换行
        width: width || 'auto',
      },
    };
    if (titleField) {
      if (displayStyle === 'tag') {
        const result = castArray(value).map((v, idx) => (
          <React.Fragment key={idx}>{this.renderInDisplayStyle(v?.[titleField], v)}</React.Fragment>
        ));
        return <Typography.Text {...typographyProps}>{result}</Typography.Text>;
      } else {
        const result = castArray(value).flatMap((v, idx) => {
          const node = this.renderInDisplayStyle(v?.[titleField], v);
          return idx === 0 ? [node] : [<span key={`sep-${idx}`}>, </span>, node];
        });
        return <Typography.Text {...typographyProps}>{result}</Typography.Text>;
      }
    } else {
      const textContent = <Typography.Text {...typographyProps}>{this.renderInDisplayStyle(value)}</Typography.Text>;
      return textContent;
    }
  }
}

ClickableFieldModel.registerFlow({
  key: 'displayFieldSettings',
  title: escapeT('Display Field settings'),
  sort: 200,
  steps: {
    displayStyle: {
      title: escapeT('Display style'),
      uiSchema: (ctx) => {
        if (['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'].includes(ctx.collectionField?.interface)) {
          return null;
        }

        return {
          displayStyle: {
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
              { label: escapeT('Tag'), value: 'tag' },
              { label: escapeT('Text'), value: 'text' },
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
        ctx.model.setProps({ clickToOpen: params.clickToOpen, ...ctx.collectionField.getComponentProps() });
      },
    },
    overflowMode: {
      title: escapeT('Content overflow display mode'),
      use: 'overflowMode',
    },
  },
});
ClickableFieldModel.registerFlow(openViewFlow);

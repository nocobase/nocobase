/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, FlowModel, reactive } from '@nocobase/flow-engine';
import { castArray } from 'lodash';
import React from 'react';
import { Tag } from 'antd';
import { css, cx } from '@emotion/css';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';
import { ReadPrettyAssociationFieldModel } from './ReadPrettyAssociationFieldModel';

const textItemClass = css`
  display: inline-block;
  white-space: nowrap;

  & + &::before {
    content: ', ';
    color: #8c8c8c;
    margin-right:
    vertical-align: baseline;
  }
`;

const LinkToggleWrapper = ({
  clickToOpen,
  displayStyle,
  children,
  currentRecord,
  parentRecord,
  onClick,
  ...restProps
}) => {
  const isTag = displayStyle === 'tag';
  const handleClick = (e) => {
    if (clickToOpen && typeof onClick === 'function') {
      onClick(e, currentRecord, parentRecord);
    }
  };

  const commonStyle = {
    cursor: clickToOpen ? 'pointer' : 'default',
    ...restProps.style,
  };
  if (isTag) {
    return (
      <Tag {...restProps} style={commonStyle} onClick={handleClick}>
        {children}
      </Tag>
    );
  }

  if (clickToOpen) {
    return (
      <a {...restProps} style={commonStyle} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <span {...restProps} style={commonStyle} className={restProps.className}>
      {children}
    </span>
  );
};

export class TagReadPrettyAssociationFieldModel extends ReadPrettyAssociationFieldModel {
  public static readonly supportedFieldInterfaces = [
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
    'mbm',
  ];

  set onClick(fn) {
    this.setProps({ ...this.props, onClick: fn });
  }
  private fieldModelCache: Record<string, FlowModel> = {};
  @reactive
  public render() {
    const { fieldNames, clickToOpen = true } = this.props;
    const value = this.getValue();
    const parentRecord = this.getSharedContext()?.currentRecord;
    if (!value || !fieldNames) return null;
    const arrayValue = castArray(value);
    const field = this.subModels.field as FlowModel;

    return (
      <>
        {arrayValue.map((v, index) => {
          const key = `${index}-${this.ctx.shared.index || 0}`;
          let fieldModel = this.fieldModelCache[v?.[fieldNames.label] + key];

          if (!fieldModel) {
            fieldModel = field.createFork({}, key);
            fieldModel.setSharedContext({
              index,
              value: v?.[fieldNames.label],
              currentRecord: v,
            });
            this.fieldModelCache[v?.[fieldNames.label] + key] = fieldModel;
          }

          const content = v?.[fieldNames.label] ? fieldModel.render() : this.flowEngine.translate('N/A');
          const itemClass = this.props.displayStyle === 'text' && textItemClass;
          return (
            <LinkToggleWrapper
              key={key}
              clickToOpen={clickToOpen}
              {...this.props}
              parentRecord={parentRecord}
              currentRecord={v}
              className={cx(this.props.className, itemClass)}
              displayStyle={this.props.displayStyle}
              onClick={this.props.onClick}
            >
              <span className={itemClass}>{content}</span>
            </LinkToggleWrapper>
          );
        })}
      </>
    );
  }
}

TagReadPrettyAssociationFieldModel.registerFlow({
  key: 'tagSettings',
  title: escapeT('Association tag settings'),
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
      title: escapeT('Label field'),
      async handler(ctx, params) {
        const { target } = ctx.model.collectionField;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const label = params.label || targetCollection.options.titleField || filterKey;
        const newFieldNames = {
          value: filterKey,
          label,
        };
        const targetCollectionField = targetCollection.getField(label);
        const use = targetCollectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
        ctx.model.setProps({ fieldNames: newFieldNames });
        const model = ctx.model.setSubModel('field', {
          use,
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: ctx.model.collectionField.dataSourceKey,
                collectionName: target,
                fieldPath: newFieldNames.label,
              },
            },
          },
        });
        await model.applyAutoFlows();
      },
    },
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
        ctx.model.setProps('displayStyle', params.displayStyle);
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
          const sourceCollection = ctx.shared.currentBlockModel.collection;
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
        ctx.model.setProps('clickToOpen', params.clickToOpen);
      },
    },
  },
});

TagReadPrettyAssociationFieldModel.registerFlow({
  key: 'popupSettings',
  title: escapeT('Popup settings'),
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
      defaultParams(ctx) {
        return {};
      },
    },
  },
});

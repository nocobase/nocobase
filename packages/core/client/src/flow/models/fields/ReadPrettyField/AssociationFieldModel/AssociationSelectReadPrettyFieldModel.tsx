/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { castArray } from 'lodash';
import { Button } from 'antd';
import { tval } from '@nocobase/utils/client';
import { AssociationReadPrettyFieldModel } from './AssociationReadPrettyFieldModel';
import { reactive, FlowModel } from '@nocobase/flow-engine';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';

const LinkToggleWrapper = ({ enableLink, children, currentRecord, ...props }) => {
  return enableLink ? (
    <Button
      style={{ padding: 0, height: 'auto' }}
      type="link"
      {...props}
      onClick={(e) => {
        props.onClick(e, currentRecord);
      }}
    >
      {children}
    </Button>
  ) : (
    children
  );
};

export class AssociationSelectReadPrettyFieldModel extends AssociationReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = [
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
  ];

  set onClick(fn) {
    this.setProps({ ...this.props, onClick: fn });
  }
  private fieldModelCache: Record<string, FlowModel> = {};
  @reactive
  public render() {
    const { fieldNames, enableLink = true } = this.props;
    const value = this.getValue();
    if (!value) return null;

    const arrayValue = castArray(value);
    const field = this.subModels.field as FlowModel;
    return (
      <>
        {arrayValue.map((v, index) => {
          const key = `${index}`;
          let fieldModel = this.fieldModelCache[v?.[fieldNames.label]];

          if (!fieldModel) {
            fieldModel = field.createFork({}, key);
            fieldModel.setSharedContext({
              index,
              value: v?.[fieldNames.label],
              currentRecord: v,
            });
            this.fieldModelCache[v?.[fieldNames.label]] = fieldModel;
          }

          const content = v?.[fieldNames.label] ? fieldModel.render() : this.flowEngine.translate('N/A');

          return (
            <React.Fragment key={index}>
              {index > 0 && ', '}
              <LinkToggleWrapper enableLink={enableLink} {...this.props} currentRecord={v}>
                {content}
              </LinkToggleWrapper>
            </React.Fragment>
          );
        })}
      </>
    );
  }
}

AssociationSelectReadPrettyFieldModel.registerFlow({
  key: 'fieldNames',
  title: tval('Specific properties'),
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
      title: tval('Title field'),
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
            default: {
              step1: {
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
    enableLink: {
      title: 'Enable link',
      uiSchema: {
        enableLink: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        enableLink: true,
      },
      handler(ctx, params) {
        ctx.model.onClick = (e, currentRecord) => {
          ctx.model.dispatchEvent('click', {
            event: e,
            filterByTk: currentRecord[ctx.model.targetCollection.filterTargetKey],
            collectionName: ctx.model.targetCollection.name,
          });
          ctx.model.setStepParams('FormModel.default', 'step1', {
            collectionName: ctx.model.targetCollection.name,
          });
        };
        ctx.model.setProps('enableLink', params.enableLink);
      },
    },
  },
});

AssociationSelectReadPrettyFieldModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    openView: {
      use: 'openView',
      defaultParams(ctx) {
        return {};
      },
    },
  },
});

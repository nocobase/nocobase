/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { tval } from '@nocobase/utils/client';
import { AssociationReadPrettyFieldModel } from './AssociationReadPrettyFieldModel';
import { FlowEngineProvider, reactive } from '@nocobase/flow-engine';
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
  @reactive
  public render() {
    const { fieldNames, enableLink = true } = this.props;
    const value = this.getValue();
    if (!this.collectionField || !value) {
      return;
    }
    const { target } = this.collectionField?.options || {};
    const collectionManager = this.collectionField.collection.collectionManager;
    const targetCollection = collectionManager.getCollection(target);
    const targetLabelField = targetCollection.getField(fieldNames.label);
    const fieldClasses = Array.from(this.flowEngine.filterModelClassByParent('ReadPrettyFieldModel').values())?.sort(
      (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
    );
    const fieldInterfaceName = targetLabelField?.options?.interface;
    const fieldClass = fieldClasses.find((fieldClass) => {
      return fieldClass.supportedFieldInterfaces?.includes(fieldInterfaceName);
    });
    const model = this.flowEngine.createModel({
      use: fieldClass?.name || 'ReadPrettyFieldModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: this.collectionField.collection.dataSourceKey,
            collectionName: target,
            fieldPath: fieldNames.label,
          },
        },
      },
      props: {
        dataSource: targetLabelField.enum,
        ...targetLabelField.getComponentProps(),
      },
    });
    model.setSharedContext({
      ...this.ctx.shared,
      value: value?.[fieldNames.label],
      currentRecord: value,
    });
    model.setParent(this.parent);
    if (Array.isArray(value)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {value.map((v, idx) => {
            const mol = model.createFork({}, `${idx}`);
            mol.setSharedContext({ ...this.ctx.shared, index: idx, value: v?.[fieldNames.label], currentRecord: v });
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: 'rgb(170, 170, 170)' }}>,</span>}
                <LinkToggleWrapper enableLink={enableLink} {...this.props} currentRecord={v}>
                  <FlowEngineProvider engine={this.flowEngine}>
                    {v?.[fieldNames.label] ? mol.render() : this.flowEngine.translate('N/A')}
                  </FlowEngineProvider>
                </LinkToggleWrapper>
              </React.Fragment>
            );
          })}
        </div>
      );
    }
    return (
      <LinkToggleWrapper enableLink={enableLink} {...this.props} currentRecord={value}>
        <FlowEngineProvider engine={this.flowEngine}>{model.render()}</FlowEngineProvider>
      </LinkToggleWrapper>
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
      handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const newFieldNames = {
          value: filterKey,
          label: params.label || targetCollection.options.titleField || filterKey,
        };
        ctx.model.setProps({ fieldNames: newFieldNames });
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

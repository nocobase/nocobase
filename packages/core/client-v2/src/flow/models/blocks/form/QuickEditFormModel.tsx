/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  BaseRecordResource,
  Collection,
  CollectionField,
  FieldModelRenderer,
  FlowEngine,
  FlowModel,
  FlowModelRenderer,
  FormItem,
  SingleRecordResource,
  createCurrentRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
} from '@nocobase/flow-engine';
import { Button, Form, Skeleton, Space } from 'antd';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { FormComponent } from './FormBlockModel';
import { FormItemModel } from './FormItemModel';

export const QUICK_EDIT_POPOVER_MAX_HEIGHT = 'calc(100vh - 96px)';
export const QUICK_EDIT_FORM_MAX_HEIGHT = 'calc(100vh - 160px)';
export const QUICK_EDIT_MARKDOWN_HEIGHT = 'min(480px, calc(100vh - 320px))';
const QUICK_EDIT_MOBILE_DRAWER_HEIGHT = '50vh';
const QUICK_EDIT_MOBILE_FORM_MAX_HEIGHT = 'calc(50vh - var(--nb-mobile-page-header-height, 40px) - 132px)';
const QUICK_EDIT_MOBILE_CONTENT_PADDING = '8px var(--nb-mobile-page-tabs-content-padding, 12px) 0';
const QUICK_EDIT_MOBILE_ACTIONS_PADDING =
  '8px var(--nb-mobile-page-tabs-content-padding, 12px) calc(80px + env(safe-area-inset-bottom, 0px))';
const QUICK_EDIT_MOBILE_MEDIA_QUERY = '(max-width: 768px)';

type QuickEditViewBeforeClosePayload = {
  result?: unknown;
  force?: boolean;
  [key: string]: unknown;
};

type QuickEditViewBeforeCloseHandler = (
  payload: QuickEditViewBeforeClosePayload,
) => Promise<boolean | void> | boolean | void;

type QuickEditViewUpdateConfig = {
  preventClose?: boolean;
  [key: string]: unknown;
};

type QuickEditViewContainer = {
  close: (result?: unknown, force?: boolean) => Promise<boolean | void> | boolean | void;
  update?: (newConfig: QuickEditViewUpdateConfig) => unknown;
  beforeClose?: QuickEditViewBeforeCloseHandler;
};

type QuickEditViewContext = {
  defineProperty?: (key: string, options: { value: unknown }) => void;
};

export function getQuickEditFieldProps(collectionField: CollectionField, fieldProps?: Record<string, any>) {
  const nextProps = { ...collectionField.getComponentProps(), ...(fieldProps || {}) };
  if (['markdown', 'vditor'].includes(collectionField.interface) && nextProps.height == null) {
    nextProps.height = QUICK_EDIT_MARKDOWN_HEIGHT;
  }
  return nextProps;
}

function getQuickEditMobileLayoutState(flowEngine: FlowEngine, sourceFieldModel?: FlowModel) {
  const sourceMobileLayout = sourceFieldModel?.context?.isMobileLayout;
  if (typeof sourceMobileLayout === 'boolean') {
    return { isMobileLayout: sourceMobileLayout, inheritsMobileContext: sourceMobileLayout };
  }

  const engineMobileLayout = flowEngine.context?.isMobileLayout;
  if (typeof engineMobileLayout === 'boolean') {
    return { isMobileLayout: engineMobileLayout, inheritsMobileContext: engineMobileLayout };
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { isMobileLayout: false, inheritsMobileContext: false };
  }

  return {
    isMobileLayout: window.matchMedia(QUICK_EDIT_MOBILE_MEDIA_QUERY).matches,
    inheritsMobileContext: false,
  };
}

function getQuickEditTitle(
  flowEngine: FlowEngine,
  dataSourceKey: string,
  collectionName: string,
  fieldPath: string,
  sourceFieldModel?: FlowModel,
  fieldProps?: Record<string, unknown>,
): React.ReactNode {
  const sourceColumnTitle = sourceFieldModel?.parent?.props?.title;
  if (sourceColumnTitle) {
    return sourceColumnTitle;
  }

  const fieldPropsTitle = fieldProps?.title;
  if (fieldPropsTitle) {
    return fieldPropsTitle as React.ReactNode;
  }

  const collectionField = flowEngine.context.dataSourceManager.getCollectionField(
    `${dataSourceKey}.${collectionName}.${fieldPath}`,
  ) as CollectionField | undefined;
  return collectionField?.title || fieldPath;
}

function createQuickEditViewContainer(view: QuickEditViewContainer): QuickEditViewContainer {
  let preventClose = false;
  let nextBeforeClose = view.beforeClose;
  const beforeClose: QuickEditViewBeforeCloseHandler = async (payload) => {
    if (preventClose && !payload?.force) {
      return false;
    }

    const result = await nextBeforeClose?.(payload);
    return result !== false;
  };
  view.beforeClose = beforeClose;

  return {
    ...view,
    close(result, force) {
      return view.close(result, force);
    },
    update(newConfig) {
      if (Object.prototype.hasOwnProperty.call(newConfig, 'preventClose')) {
        preventClose = !!newConfig.preventClose;
      }
      return view.update?.(newConfig);
    },
    get beforeClose() {
      return view.beforeClose;
    },
    set beforeClose(value) {
      nextBeforeClose = value;
      view.beforeClose = beforeClose;
    },
  };
}

export class QuickEditFormModel extends FlowModel {
  fieldPath: string;

  declare resource: SingleRecordResource;
  declare collection: Collection;

  declare viewContainer: QuickEditViewContainer;
  __onSubmitSuccess;
  _fieldProps: any;
  _onOk: any;

  get form() {
    return this.context.form;
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });
  }

  static async open(options: {
    flowEngine: FlowEngine;
    target: any;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    record: any;
    filterByTk?: string;
    onSuccess?: (values: any) => void;
    fieldProps?: any;
    sourceFieldModelUid?: string;
    onOk?: (values: any) => void;
  }) {
    const {
      flowEngine,
      target,
      dataSourceKey,
      collectionName,
      fieldPath,
      filterByTk,
      record,
      onSuccess,
      fieldProps,
      onOk,
      sourceFieldModelUid,
    } = options;
    const sourceFieldModel = sourceFieldModelUid ? flowEngine.getModel<FlowModel>(sourceFieldModelUid) : undefined;
    const model = flowEngine.createModel(
      {
        use: 'QuickEditFormModel',
        stepParams: {
          quickEditFormSettings: {
            init: {
              dataSourceKey,
              collectionName,
              fieldPath,
            },
          },
        },
      },
      sourceFieldModel ? { delegate: sourceFieldModel.context } : undefined,
    ) as QuickEditFormModel;

    const bodyStyles = {
      maxHeight: QUICK_EDIT_POPOVER_MAX_HEIGHT,
      overflowY: 'auto',
      overscrollBehavior: 'contain',
    };
    const mobileBodyStyles = {
      ...bodyStyles,
      maxHeight: QUICK_EDIT_MOBILE_DRAWER_HEIGHT,
    };
    const content = (view: QuickEditViewContainer, viewContext?: QuickEditViewContext) => {
      if (mobileLayoutState.isMobileLayout) {
        viewContext?.defineProperty?.('isMobileLayout', { value: true });
      }
      model.viewContainer = createQuickEditViewContainer(view);
      model.__onSubmitSuccess = onSuccess;
      model._fieldProps = fieldProps;
      model._onOk = onOk;
      return (
        <FlowModelRenderer
          fallback={<Skeleton.Input size="small" />}
          model={model}
          inputArgs={{ filterByTk, record, sourceFieldModelUid }}
        />
      );
    };
    const mobileLayoutState = getQuickEditMobileLayoutState(flowEngine, sourceFieldModel);
    if (mobileLayoutState.isMobileLayout) {
      model.context.defineProperty('isMobileLayout', { value: true });
      const viewer = sourceFieldModel?.context?.viewer || flowEngine.context.viewer;
      const title = getQuickEditTitle(
        flowEngine,
        dataSourceKey,
        collectionName,
        fieldPath,
        sourceFieldModel,
        fieldProps,
      );
      await viewer.open({
        type: 'drawer',
        title,
        closable: true,
        placement: 'bottom',
        inputArgs: {
          isMobileLayout: true,
        },
        styles: {
          body: mobileBodyStyles,
        },
        content,
      });
      return;
    }

    await flowEngine.context.viewer.open({
      type: 'popover',
      target,
      placement: 'rightTop',
      styles: {
        body: {
          width: 420,
          ...bodyStyles,
        },
      },
      content,
    });
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.resource.getData(),
      cache: false,
      resolveOnServer: createRecordResolveOnServerWithLocal(
        () => this.collection,
        () => this.resource.getData(),
      ),
      meta: recordMeta,
    });
    this.context.defineProperty('collection', {
      get: () => this.collection,
    });
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.context.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    ) as CollectionField;
    if (!field) {
      return;
    }
    if (!field.isAssociationField()) {
      return;
    }
    (this.resource as BaseRecordResource).addAppends(fieldPath);
    if (refresh) {
      this.resource.refresh();
    }
  }

  render() {
    const isMobileLayout = this.context.isMobileLayout;
    return (
      <FormComponent model={this}>
        <div
          style={{
            minHeight: 0,
            overflowY: 'auto',
            maxHeight: isMobileLayout ? QUICK_EDIT_MOBILE_FORM_MAX_HEIGHT : QUICK_EDIT_FORM_MAX_HEIGHT,
            padding: isMobileLayout ? QUICK_EDIT_MOBILE_CONTENT_PADDING : undefined,
          }}
        >
          {this.mapSubModels('fields', (field) => {
            return (
              <FormItem
                showLabel={false}
                name={this.fieldPath}
                key={field.uid}
                initialValue={this.context.record?.[this.fieldPath]}
                {...this.props}
              >
                <FieldModelRenderer model={field} fallback={<Skeleton.Input size="small" />} />
              </FormItem>
            );
          })}
        </div>
        <Space
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
            padding: isMobileLayout ? QUICK_EDIT_MOBILE_ACTIONS_PADDING : undefined,
          }}
        >
          <Button
            onClick={() => {
              this.viewContainer.close();
            }}
          >
            {this.context.t('Cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            onClick={async () => {
              const values = this.form.getFieldsValue();
              await this.form.submit();
              const formValues = {
                ...values,
              };
              const originalValues = {
                [this.fieldPath]: this.resource.getData()?.[this.fieldPath],
              };
              if (this._onOk) {
                this._onOk(formValues);
                this.viewContainer.close();
              } else {
                try {
                  await this.resource.save(formValues, { refresh: false });
                  this.__onSubmitSuccess?.(formValues);
                  this.viewContainer.close();
                  this.context.message.success(this.context.t('Saved successfully'));
                } catch (error) {
                  console.error('Failed to save form data:', error);
                  this.context.message.error(this.context.t('Failed to save form data'));
                  this.__onSubmitSuccess?.(originalValues);
                }
              }
            }}
          >
            {this.context.t('Submit')}
          </Button>
        </Space>
      </FormComponent>
    );
  }
}

QuickEditFormModel.registerFlow({
  key: 'quickEditFormSettings',
  sort: 100,
  steps: {
    init: {
      async handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        ctx.model.fieldPath = fieldPath;
        ctx.model.collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
        const resource = ctx.createResource(SingleRecordResource);
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(collectionName);
        ctx.model.resource = resource;
        const collectionField = ctx.model.collection.getField(fieldPath) as CollectionField;
        if (collectionField) {
          const binding = FormItemModel.getDefaultBindingByField(ctx, collectionField);
          if (!binding) {
            return;
          }
          const use = binding.modelName;
          const fieldModel = ctx.model.addSubModel<FieldModel>('fields', {
            use,
            props:
              typeof binding.defaultProps === 'function'
                ? binding.defaultProps(ctx, collectionField)
                : binding.defaultProps,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey,
                  collectionName,
                  fieldPath,
                },
              },
            },
          });
          fieldModel.setProps(getQuickEditFieldProps(collectionField, ctx.model._fieldProps));
          fieldModel.setProps({ sourceFieldModelUid: ctx.inputArgs.sourceFieldModelUid });
          ctx.model.context.defineProperty('collectionField', {
            get: () => collectionField,
          });
          ctx.model.addAppends(fieldPath);
          await fieldModel.dispatchEvent('beforeRender');
        }
        if (ctx.inputArgs.filterByTk || ctx.inputArgs.record) {
          resource.setFilterByTk(ctx.inputArgs.filterByTk);
          resource.setData(ctx.inputArgs.record);
          ctx.model.form?.setFieldsValue(resource.getData());
        }
      },
    },
  },
});

QuickEditFormModel.define({
  hide: true,
});

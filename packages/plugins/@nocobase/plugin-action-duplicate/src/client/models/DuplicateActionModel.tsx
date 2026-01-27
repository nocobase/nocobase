/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, useFlowContext, useFlowViewContext, FlowModelRenderer } from '@nocobase/flow-engine';
import { onFieldInputValueChange } from '@formily/core';
import { connect, mapProps, useForm } from '@formily/react';
import { ActionModel, ActionSceneEnum, useRequest, SkeletonFallback } from '@nocobase/client';
import { Tree as AntdTree } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import { getCollectionState, getSyncFromForm } from './utils';

const Tree = connect(
  AntdTree,
  mapProps((props: any, field: any) => {
    const { loadData } = props;
    useEffect(() => {
      field.value = props.defaultCheckedKeys || [];
    }, []);
    const [dataSource, setDataSource] = useState(props?.treeData || []);
    const [checkedKeys, setCheckedKeys] = useState(props.defaultCheckedKeys || []);
    const onCheck = (checkedKeys) => {
      setCheckedKeys(checkedKeys);
      field.value = checkedKeys;
    };
    field.onCheck = onCheck;
    const form = useForm();
    useEffect(() => {
      const data = props.getEnableFieldTree(form.values.collection);
      setDataSource(data);
      field.dataSource = data;
    }, [form.values.collection]);

    useEffect(() => {
      setDataSource(field.dataSource);
    }, [field.dataSource]);

    return {
      ...props,
      checkedKeys,
      onCheck,
      loadData: loadData(dataSource, setDataSource),
      treeData: dataSource.map((v: any) => {
        if (form.values.duplicateMode === 'quickDulicate') {
          const children = v?.children?.map((k) => {
            return {
              ...k,
              disabled: false,
            };
          });
          return {
            ...v,
            disabled: false,
            children,
          };
        }
        return v;
      }),
    };
  }),
);

function RemoteModelRenderer({ options }) {
  const ctx = useFlowViewContext();
  const { data, loading }: any = useRequest(
    async () => {
      const model: any = await ctx.engine.loadOrCreateModel(options, { delegateToParent: false, delegate: ctx });
      return model;
    },
    {
      refreshDeps: [ctx, options],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

function EditFormContent({ model }) {
  const ctx = useFlowContext();
  const { Header, type } = ctx.view;
  model._closeView = ctx.view.close;
  const title = ctx.t('Duplicate record');
  return (
    <div>
      <Header
        title={
          type === 'dialog' ? (
            <div
              style={{
                padding: `${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px 0`,
                marginBottom: -ctx.themeToken.marginSM,
                backgroundColor: 'var(--colorBgLayout)',
              }}
            >
              {title}
            </div>
          ) : (
            title
          )
        }
      />
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: `deplicate.edit-form-grid-block`,
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
    </div>
  );
}

export class DuplicateActionModel extends ActionModel {
  declare props: any;
  static scene = ActionSceneEnum.record;

  defaultProps: any = {
    type: 'link',
    title: tExpr('Duplicate'),
    duplicateFields: [],
  };

  getAclActionName() {
    return 'create';
  }
  onClick(event) {
    if (this.props.duplicateMode === 'quickDulicate') {
      this.dispatchEvent(
        'quickCreateClick',
        {
          event,
          ...this.getInputArgs(),
        },
        {
          debounce: true,
        },
      );
    } else {
      this.dispatchEvent(
        'openDuplicatePopup',
        {
          event,
          ...this.getInputArgs(),
        },
        {
          debounce: true,
        },
      );
    }
  }
}

DuplicateActionModel.define({
  label: tExpr('Duplicate'),
  sort: 60,
});

//复制模式
DuplicateActionModel.registerFlow({
  key: 'duplicateModeSettings',
  steps: {
    duplicateMode: {
      title: tExpr('Duplicate mode'),
      uiSchema(ctx) {
        const t = ctx.t;
        const collections =
          ctx.dataSourceManager
            .getDataSource('main')
            .collectionManager.getAllCollectionsInheritChain(ctx.blockModel.collection.name) || [];
        const collectionList = collections.map((name) => ({
          label: ctx.dataSourceManager.getDataSource('main').collectionManager.getCollection(name)?.title,
          value: name,
        }));

        const duplicateValues = cloneDeep((ctx.model.props as any)?.duplicateFields || []);

        const getAllkeys = (data, result) => {
          for (let i = 0; i < data?.length; i++) {
            const { children, ...rest } = data[i];
            result.push(rest.key);
            if (children) {
              getAllkeys(children, result);
            }
          }
          return result;
        };

        const { getEnableFieldTree, getOnLoadData, getOnCheck } = getCollectionState(
          ctx.dataSourceManager,
          t,
          ctx.blockModel.collection.dataSourceKey,
        );

        ctx.model.flowEngine.flowSettings.registerScopes({
          collectionName: ctx.record?.__collection || ctx.blockModel.collection.name,
          currentCollection: ctx.record?.__collection || ctx.blockModel.collection.name,
          getOnLoadData,
          getOnCheck,
          treeData: [],
          duplicateValues,
          onFieldInputValueChange,
        });

        return {
          duplicateMode: {
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            enum: [
              { value: 'quickDulicate', label: '{{t("Direct duplicate")}}' },
              { value: 'continueduplicate', label: '{{t("Copy into the form and continue to fill in")}}' },
            ],
          },
          collection: {
            type: 'string',
            title: '{{ t("Target collection") }}',
            required: true,
            description: t('If collection inherits, choose inherited collections as templates'),
            default: '{{ collectionName }}',
            'x-display': collectionList.length > 1 ? 'visible' : 'hidden',
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              options: collectionList,
            },
            'x-reactions': [
              {
                dependencies: ['.duplicateMode'],
                fulfill: {
                  state: {
                    disabled: `{{ $deps[0]==="quickDulicate" }}`,
                    value: `{{ $deps[0]==="quickDulicate"? currentCollection:collectionName }}`,
                  },
                },
              },
            ],
          },
          syncFromForm: {
            type: 'void',
            title: '{{ t("Sync from form fields") }}',
            'x-component': () => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const form = useForm();
              const { run } = getSyncFromForm(
                ctx.dataSourceManager,
                ctx.t,
                ctx.blockModel.collection.dataSourceKey,
                ctx.record?.__collection || ctx.blockModel.collection.name,
                (treeData, selectFields) => {
                  form.query('duplicateFields').take((f: any) => {
                    f.dataSource = treeData;
                    f.componentProps.defaultCheckedKeys = selectFields;
                    f.setInitialValue(selectFields);
                    f?.onCheck(selectFields);
                  });
                },
              );
              return (
                <a
                  onClick={async () => {
                    const model = await ctx.engine.loadModel({ parentId: ctx.model.uid });
                    run(model.subModels.items[0].subModels.grid);
                  }}
                  style={{ float: 'right', position: 'relative', zIndex: 1200 }}
                >
                  {t('Sync from form fields')}
                </a>
              );
            },

            'x-reactions': [
              {
                dependencies: ['.duplicateMode'],
                fulfill: {
                  state: {
                    visible: `{{ $deps[0]!=="quickDulicate" }}`,
                  },
                },
              },
            ],
          },
          selectAll: {
            type: 'void',
            title: '{{ t("Select all") }}',
            'x-component': () => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const form = useForm();
              return (
                <a
                  onClick={() => {
                    form.query('duplicateFields').take((f: any) => {
                      const selectFields = getAllkeys(f.dataSource, []);
                      f.componentProps.defaultCheckedKeys = selectFields;
                      f.setInitialValue(selectFields);
                      f?.onCheck?.(selectFields);
                    });
                  }}
                  style={{ float: 'right', position: 'relative', zIndex: 1200 }}
                >
                  {t('Select all')}
                </a>
              );
            },
            'x-reactions': [
              {
                dependencies: ['.duplicateMode'],
                fulfill: {
                  state: {
                    visible: `{{ $deps[0]==="quickDulicate"}}`,
                  },
                },
              },
            ],
          },
          unselectAll: {
            type: 'void',
            title: '{{ t("UnSelect all") }}',
            'x-component': () => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const form = useForm();
              return (
                <a
                  style={{ float: 'right', position: 'relative', zIndex: 1200, marginRight: '10px' }}
                  onClick={() => {
                    form.query('duplicateFields').take((f: any) => {
                      f.componentProps.defaultCheckedKeys = [];
                      f.setInitialValue([]);
                      f?.onCheck([]);
                    });
                  }}
                >
                  {t('UnSelect all')}
                </a>
              );
            },
            'x-reactions': [
              {
                dependencies: ['.duplicateMode', '.duplicateFields'],
                fulfill: {
                  state: {
                    visible: `{{ $deps[0]==="quickDulicate"&&$form.getValuesIn('duplicateFields').length>0 }}`,
                  },
                },
              },
            ],
          },
          duplicateFields: {
            type: 'array',
            title: '{{ t("Data fields") }}',
            required: true,
            description: t('Only the selected fields will be used as the initialization data for the form'),
            'x-decorator': 'FormItem',
            'x-component': Tree,
            'x-component-props': {
              defaultCheckedKeys: duplicateValues,
              treeData: [],
              checkable: true,
              checkStrictly: true,
              selectable: false,
              loadData: getOnLoadData,
              onCheck: '{{ getOnCheck($self) }}',
              getEnableFieldTree,
              rootStyle: {
                padding: '8px 0',
                border: '1px solid #d9d9d9',
                borderRadius: '2px',
                maxHeight: '30vh',
                overflow: 'auto',
                margin: '2px 0',
              },
            },

            'x-reactions': [
              {
                dependencies: ['.collection'],
                fulfill: {
                  state: {
                    disabled: '{{ !$deps[0] }}',
                  },
                },
              },
            ],
          },
        };
      },
      defaultParams: {
        duplicateMode: 'quickDulicate',
      },
      async handler(ctx, params) {
        const { duplicateMode, duplicateFields, collection, treeData } = params;
        const fields = Array.isArray(duplicateFields) ? duplicateFields : duplicateFields?.checked || [];
        ctx.model.setProps({
          duplicateMode,
          duplicateFields: fields,
          duplicateCollection: collection,
          treeData: treeData,
        });
      },
    },
  },
});

async function fetchTemplateData(resource: any, template: { collection: string; dataId: number; fields: string[] }) {
  if (!template?.dataId || template.fields?.length === 0) {
    return;
  }

  const res = await resource.runAction('get', {
    params: {
      filterByTk: template.dataId,
      fields: template.fields,
      isTemplate: true,
    },
  });

  return res?.data;
}

//快捷创建
DuplicateActionModel.registerFlow({
  key: 'duplicateSettings',
  title: tExpr('Duplicate mode settings'),
  on: 'quickCreateClick',
  steps: {
    duplicate: {
      async handler(ctx, params) {
        const { duplicateFields = [] } = ctx.model.props;
        if (!duplicateFields?.length) {
          ctx.message.error(ctx.t('Please configure the duplicate fields'));
          return;
        }
        const filterTargetKey = ctx.blockModel.collection.filterTargetKey;
        const dataId = Array.isArray(ctx.blockModel.collection.filterTargetKey)
          ? Object.assign(
              {},
              ...filterTargetKey.map((v) => {
                return { [v]: ctx.record[v] };
              }),
            )
          : ctx.record[filterTargetKey] || ctx.record.id;
        const template = {
          key: 'duplicate',
          dataId,
          default: true,
          fields:
            duplicateFields?.filter((v) => {
              return [...ctx.collection.fields.values()].find((k) => v.includes(k.name));
            }) || [],
          collection: ctx.record.__collection || ctx.blockModel.collection.name,
        };

        const data = await fetchTemplateData(ctx.resource, template);
        await ctx.blockModel.resource.create(
          {
            ...data,
          },
          params.requestConfig,
        );
        ctx.message.success(ctx.t('Saved successfully'));
      },
    },
  },
});

// 复制并继续填写
DuplicateActionModel.registerFlow({
  key: 'popupSettings',
  on: {
    eventName: 'openDuplicatePopup',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit popup'),
      hideInSettings(ctx) {
        const duplicateMode = ctx.model.getStepParams?.('duplicateModeSettings', 'duplicateMode')?.duplicateMode;
        return duplicateMode === 'quickDulicate';
      },
      uiSchema: {
        mode: {
          type: 'string',
          title: tExpr('Open mode'),
          enum: [
            { label: tExpr('Drawer'), value: 'drawer' },
            { label: tExpr('Dialog'), value: 'dialog' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        size: {
          type: 'string',
          title: tExpr('Popup size'),
          enum: [
            { label: tExpr('Small'), value: 'small' },
            { label: tExpr('Medium'), value: 'medium' },
            { label: tExpr('Large'), value: 'large' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      async handler(ctx, params) {
        const { duplicateFields = [] } = ctx.model.props;
        if (!duplicateFields?.length) {
          ctx.message.error(ctx.t('Please configure the duplicate fields'));
          return;
        }
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        const filterTargetKey = ctx.blockModel.collection.filterTargetKey;
        const dataId = Array.isArray(ctx.blockModel.collection.filterTargetKey)
          ? Object.assign(
              {},
              ...filterTargetKey.map((v) => {
                return { [v]: ctx.record[v] };
              }),
            )
          : ctx.record[filterTargetKey] || ctx.record.id;
        const template = {
          key: 'duplicate',
          dataId,
          default: true,
          fields:
            duplicateFields?.filter((v) => {
              return [...ctx.collection.fields.values()].find((k) => v.includes(k.name));
            }) || [],
          collection: ctx.record.__collection || ctx.blockModel.collection.name,
        };

        const formData = await fetchTemplateData(ctx.resource, template);
        ctx.model.context.defineProperty('record', {
          get: () => ctx.view.inputArgs.formData || {},
          cache: false,
        });
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'new',
            dataSourceKey: ctx.blockModel.collection.dataSourceKey,
            collectionName: ctx.record.__collection || ctx.blockModel.collection.name,
            formData,
            viewUid: ctx.blockModel.uid,
          },
          content: () => <EditFormContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
        });
      },
    },
  },
});

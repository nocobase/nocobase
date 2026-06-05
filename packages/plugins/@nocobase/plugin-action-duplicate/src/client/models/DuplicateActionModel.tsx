/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  tExpr,
  useFlowContext,
  useFlowViewContext,
  FlowModelRenderer,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { onFieldInputValueChange } from '@formily/core';
import { connect, mapProps, useForm } from '@formily/react';
import { ActionModel, ActionSceneEnum, useRequest, SkeletonFallback } from '@nocobase/client';
import { Tree as AntdTree } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import { getCollectionState, getSyncFromForm } from './utils';
import { NAMESPACE } from '../locale';

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
const EditDuplicateSubKey = 'deplicate.edit-form-grid-block';
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
          subKey: EditDuplicateSubKey,
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
  duplicateLoading = false;

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
  getTitle() {
    return this.duplicateLoading ? this.context.t('Duplicating') : this.props.title || this.context.t('Duplicate');
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
      title: tExpr('Duplicate mode', { ns: NAMESPACE }),
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
              (field) => {
                if (field.form.values.duplicateMode === 'quickDulicate') {
                  field.form.setValuesIn('collection', ctx.record?.__collection || ctx.blockModel.collection.name);
                }
              },
            ],
          },
          syncFromForm: {
            type: 'void',
            title: '{{ t("Sync from form fields") }}',
            'x-component': () => {
              const popupUid = ctx.model.getStepParams?.('popupSettings', 'openView')?.uid;
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
                    ctx.message.success(t('Sync successfully'));
                  });
                },
              );
              return (
                <a
                  onClick={async () => {
                    if (popupUid) {
                      const childPageModel = await ctx.engine.loadModel({ parentId: popupUid, refresh: true });
                      const model = await ctx.engine.loadModel({
                        parentId: childPageModel.subModels.tabs[0].uid,
                      });
                      if (!model) {
                        return;
                      }
                      run(model.subModels.items[0].subModels.grid);
                    } else {
                      const model: any = await ctx.engine.loadModel({ parentId: ctx.model.uid, refresh: true });
                      if (!model) {
                        return;
                      }
                      run(model.subModels.items[0].subModels.grid);
                    }
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
      defaultParams: (ctx) => {
        return {
          duplicateMode: 'quickDulicate',
          collection: ctx.record?.__collection || ctx.blockModel.collection.name,
        };
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

async function fetchTemplateData(resource: any, template: { dataId: number; fields: string[] }) {
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
    confirm: {
      use: 'confirm',
      hideInSettings(ctx) {
        const duplicateMode = ctx.model.getStepParams?.('duplicateModeSettings', 'duplicateMode')?.duplicateMode;
        return duplicateMode !== 'quickDulicate';
      },
      defaultParams: {
        enable: false,
        title: tExpr('Duplicate record'),
        content: tExpr('Are you sure you want to duplicate it?'),
      },
    },
    duplicate: {
      async handler(ctx, params) {
        const { duplicateFields = [] } = ctx.model.props;
        if (!duplicateFields?.length) {
          ctx.message.error(
            ctx.t('Please configure the duplicate fields in duplicate mode configuration', { ns: NAMESPACE }),
          );
          return;
        }
        if (ctx.model.duplicateLoading) {
          return;
        }
        ctx.model.duplicateLoading = true;
        ctx.model.rerender();
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
          dataId,
          default: true,
          fields:
            duplicateFields?.filter((v) => {
              return [...ctx.collection.fields.values()].find((k) => v.includes(k.name));
            }) || [],
        };
        const resource = ctx.createResource(MultiRecordResource);
        const { dataSourceKey } = ctx.blockModel.collection;
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(ctx.record.__collection || ctx.blockModel.collection.name);

        const data = await fetchTemplateData(resource, template);
        await ctx.blockModel.resource.create(
          {
            ...data,
          },
          params.requestConfig,
        );
        ctx.message.success(ctx.t('Saved successfully'));
        ctx.model.duplicateLoading = false;
        ctx.model.rerender();
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
    confirm: {
      use: 'confirm',
      hideInSettings(ctx) {
        const duplicateMode = ctx.model.getStepParams?.('duplicateModeSettings', 'duplicateMode')?.duplicateMode;
        return duplicateMode === 'quickDulicate';
      },
      defaultParams: {
        enable: false,
        title: tExpr('Duplicate record'),
        content: tExpr('Are you sure you want to duplicate it?'),
      },
    },
    openView: {
      title: tExpr('Edit popup'),
      hideInSettings(ctx) {
        const duplicateMode = ctx.model.getStepParams?.('duplicateModeSettings', 'duplicateMode')?.duplicateMode;
        return duplicateMode === 'quickDulicate';
      },
      use: 'openView',
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      async handler(ctx, params) {
        await ctx.model.dispatchEvent('beforeRender'); // 确保 duplicateFields 已经分析过了
        const { duplicateFields = [] } = ctx.model.props;
        if (!duplicateFields?.length) {
          ctx.message.error(
            ctx.t('Please configure the duplicate fields in duplicate mode configuration', { ns: NAMESPACE }),
          );
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
        const openMode = ctx.inputArgs?.mode || params?.mode || 'drawer';
        const size = ctx.inputArgs?.size || params?.size || 'medium';
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
          dataId,
          default: true,
          fields:
            duplicateFields?.filter((v) => {
              return [...ctx.collection.fields.values()].find((k) => v.includes(k.name));
            }) || [],
        };
        const resource = ctx.createResource(MultiRecordResource);
        const { dataSourceKey } = ctx.blockModel.collection;
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(ctx.record.__collection || ctx.blockModel.collection.name);
        const formData = await fetchTemplateData(resource, template);
        const popupTemplateUid = typeof params?.popupTemplateUid === 'string' ? params.popupTemplateUid.trim() : '';
        const targetUid = typeof params?.uid === 'string' ? params.uid.trim() : '';
        const shouldDelegateToOpenView = !!popupTemplateUid || (!!targetUid && targetUid !== ctx.model.uid);
        const runtimeViewUid = params?.viewUid || ctx.blockModel.uid;
        const runtimeDataSourceKey = params?.dataSourceKey || ctx.blockModel.collection.dataSourceKey;
        const runtimeCollectionName =
          params?.collectionName || ctx.record.__collection || ctx.blockModel.collection.name;
        if (shouldDelegateToOpenView) {
          const delegatedParams: any = {
            ...(params || {}),
            // DuplicateAction 的弹窗是自定义打开逻辑（openDuplicatePopup），
            // 不能走 openView 动作默认的路由导航（否则路由会触发 model.click，而该模型并不监听 click）。
            navigation: false,
            scene: 'new',
            formData,
            viewUid: runtimeViewUid,
            dataSourceKey: runtimeDataSourceKey,
            collectionName: runtimeCollectionName,
          };
          if (targetUid) {
            delegatedParams.uid = targetUid;
          }

          await ctx.runAction('openView', delegatedParams);
          return;
        }

        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'new',
            dataSourceKey: runtimeDataSourceKey,
            collectionName: runtimeCollectionName,
            formData,
            viewUid: runtimeViewUid,
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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { onFieldInputValueChange } from '@formily/core';
import { connect, mapProps, useForm } from '@formily/react';
import { ActionModel, ActionSceneEnum, openViewFlow } from '@nocobase/client';
import { Tree as AntdTree } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import { getCollectionState } from './utils';

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
    }, [form.values.collection]);

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
}

DuplicateActionModel.define({
  label: tExpr('Duplicate'),
  sort: 60,
});

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
        const useSelectAllFields = (form) => {
          return {
            async run() {
              form.query('duplicateFields').take((f) => {
                const selectFields = getAllkeys(f.componentProps.treeData, []);
                f.componentProps.defaultCheckedKeys = selectFields;
                f.setInitialValue(selectFields);
                f?.onCheck?.(selectFields);
              });
            },
          };
        };
        const useUnSelectAllFields = (form) => {
          return {
            async run() {
              form.query('duplicateFields').take((f) => {
                f.componentProps.defaultCheckedKeys = [];
                f.setInitialValue([]);
                f?.onCheck([]);
              });
            },
          };
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
          // syncFromForm: {
          //   type: 'void',
          //   title: '{{ t("Sync from form fields") }}',
          //   'x-component': 'Action.Link',
          //   'x-component-props': {
          //     type: 'primary',
          //     style: { float: 'right', position: 'relative', zIndex: 1200 },
          //     useAction: () => {
          //       const formSchema = useMemo(() => findFormBlock(fieldSchema), [fieldSchema]);
          //       return useSyncFromForm(
          //         formSchema,
          //         fieldSchema['x-component-props']?.duplicateCollection || record?.__collection || name,
          //         syncCallBack,
          //       );
          //     },
          //   },
          //   'x-reactions': [
          //     {
          //       dependencies: ['.duplicateMode'],
          //       fulfill: {
          //         state: {
          //           visible: `{{ $deps[0]!=="quickDulicate" }}`,
          //         },
          //       },
          //     },
          //   ],
          // },
          selectAll: {
            type: 'void',
            title: '{{ t("Select all") }}',
            'x-component': () => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const from = useForm();
              return (
                <a
                  onClick={() => {
                    return useSelectAllFields(from);
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
              const from = useForm();

              return (
                <a
                  style={{ float: 'right', position: 'relative', zIndex: 1200, marginRight: '10px' }}
                  onClick={() => {
                    return useUnSelectAllFields(from);
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

DuplicateActionModel.registerFlow(openViewFlow);

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
DuplicateActionModel.registerFlow({
  key: 'duplicateSettings',
  title: tExpr('Duplicate mode settings'),
  on: 'click',
  steps: {
    duplicate: {
      async handler(ctx, params) {
        const { duplicateMode, duplicateFields } = ctx.model.props;
        const filterTargetKey = ctx.blockModel.collection.filterTargetKey;
        const dataId = Array.isArray(ctx.blockModel.collection.filterTargetKey)
          ? Object.assign(
              {},
              ...filterTargetKey.map((v) => {
                return { [v]: ctx.record[v] };
              }),
            )
          : ctx.record[filterTargetKey] || ctx.record.id;

        if (duplicateMode === 'quickDulicate') {
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
          console.log(ctx.resourece, ctx.blockModel.resource);
          await ctx.blockModel.resource.create(
            {
              ...data,
            },
            params.requestConfig,
          );

          // await ctx.resource['create']({
          //   values: {
          //     ...data,
          //   },
          // });
          ctx.message.success(ctx.t('Saved successfully'));
        }

        // if (!ctx.resource) {
        //   ctx.message.error(ctx.t('No resource selected for deletion'));
        //   return;
        // }
        // if (!ctx.record) {
        //   ctx.message.error(ctx.t('No resource or record selected for deletion'));
        //   return;
        // }
        // await ctx.resource.destroy(ctx.blockModel.collection.getFilterByTK(ctx.record));
        // ctx.message.success(ctx.t('Record deleted successfully'));
      },
    },
  },
});

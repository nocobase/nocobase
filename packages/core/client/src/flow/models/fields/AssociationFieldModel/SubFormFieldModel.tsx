/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, PlusOutlined, ZoomInOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { tExpr, observable, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { Button, Card, Divider, Form, Tooltip, Space } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { AssociationFieldModel } from './AssociationFieldModel';
import { RecordPickerContent } from './RecordPickerFieldModel';
import { ActionWithoutPermission } from '../../base/ActionModel';
import {
  buildCurrentItemTitle,
  createAssociationItemChainContextPropertyOptions,
  createItemChainGetter,
  createParentItemAccessorsFromContext,
  createRootItemChain,
  type ItemChain,
} from './itemChain';
import { isToManyAssociationField } from '../../../internal/utils/modelUtils';

function resolveParentItemWithFallback(parentContextAccessor: () => any, formValuesAccessor: () => any): ItemChain {
  return (parentContextAccessor()?.item as ItemChain | undefined) ?? createRootItemChain(formValuesAccessor());
}

class FormAssociationFieldModel extends AssociationFieldModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField.targetCollection,
    });
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return (this.parent as FormItemModel).fieldPath;
      },
    });
    if (this.parent.context.actionName === 'update') {
      this.context.defineProperty('actionName', {
        get: () => 'view',
      });
    }
  }
}
export const ObjectNester = (props) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const rowIndex = model.context.fieldIndex;
  const record = model.context.record;
  // 在数组子表单场景下，为每个子项创建行内 fork，并透传当前行索引
  const grid = React.useMemo(() => {
    if (rowIndex == null) return gridModel;
    const fork = gridModel.createFork({}, `${rowIndex}`);
    fork.context.defineProperty('fieldIndex', {
      get: () => rowIndex,
    });
    fork.context.defineProperty('record', {
      get: () => record,
      cache: false,
    });
    fork.context.defineProperty('fieldKey', {
      get: () => rowIndex,
    });

    return fork;
  }, [gridModel, rowIndex, record]);
  useEffect(() => {
    if (props.disabled !== grid.context.parentDisabled) {
      grid.mapSubModels('items', (item) => {
        item.setProps({ disabled: props.disabled });
      });
      grid.context.defineProperty('parentDisabled', {
        get: () => props.disabled,
        cache: false,
      });
    }
  }, [props.disabled, grid]);
  useEffect(() => {
    const itemOptions = model?.context?.getPropertyOptions?.('item');
    const { value: _value, ...rest } = (itemOptions || {}) as any;
    grid.context.defineProperty('item', {
      get: () => {
        return model?.context?.item;
      },
      ...rest,
      cache: false,
    });
  }, [grid, model]);
  useEffect(() => {
    const currentObjectOptions = model?.context?.getPropertyOptions?.('currentObject');
    if (!currentObjectOptions) {
      return;
    }
    grid.context.defineProperty('currentObject', {
      get: () => model?.context?.currentObject,
      cache: false,
      // meta: currentObjectOptions?.meta,
      resolveOnServer: currentObjectOptions?.resolveOnServer,
      serverOnlyWhenContextParams: currentObjectOptions?.serverOnlyWhenContextParams,
    });
  }, [grid, model]);
  return (
    <Card>
      <FlowModelRenderer model={grid} showFlowSettings={false} />
    </Card>
  );
};
export class SubFormFieldModel extends FormAssociationFieldModel {
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
    this.context.blockModel.emitter.on('formValuesChange', (payload) => {
      this.dispatchEvent('formValuesChange', payload, { debounce: true });
    });

    const parentAccessors = createParentItemAccessorsFromContext({
      parentContextAccessor: () => (this.parent as any)?.context,
      fallbackParentPropertiesAccessor: () => this.context.formValues,
    });

    const getParentItem = () =>
      resolveParentItemWithFallback(
        () => (this.parent as any)?.context,
        () => this.context.formValues,
      );
    const getSubFormItem = createItemChainGetter({
      valueAccessor: () => this.context.form.getFieldValue(this.props.name),
      parentItemAccessor: getParentItem,
    });

    this.context.defineProperty('item', {
      get: getSubFormItem,
      ...createAssociationItemChainContextPropertyOptions({
        t: this.context.t,
        title: buildCurrentItemTitle(this.context.t, this.context.collectionField, this.props.name),
        showIndex: isToManyAssociationField(this.context.collectionField),
        showParentIndex: Array.isArray(this.context.fieldIndex) && this.context.fieldIndex.length > 0,
        collectionAccessor: () => this.context.collection,
        propertiesAccessor: (ctx) => ctx?.item?.value,
        resolverPropertiesAccessor: () => this.context.form.getFieldValue(this.props.name),
        parentCollectionAccessor: () => this.context.collectionField?.collection,
        parentAccessors,
      }),
    });

    const currentObjectOptions = this.context.getPropertyOptions?.('currentObject');
    this.context.defineProperty('currentObject', {
      get: () => this.context.form.getFieldValue(this.props.name),
      cache: false,
      // meta: currentObjectOptions?.meta,
      resolveOnServer: currentObjectOptions?.resolveOnServer,
      serverOnlyWhenContextParams: currentObjectOptions?.serverOnlyWhenContextParams,
    });
  }
  onMount() {
    super.onMount();
    // 首次渲染触发一次事件流
    setTimeout(() => {
      this.applyFlow('eventSettings');
    }, 100); // TODO：待修复。不延迟的话，会导致 disabled 的状态不生效
  }
  render() {
    return <ObjectNester {...this.props} />;
  }
}

SubFormFieldModel.define({
  label: tExpr('Subform'),
  createModelOptions: {
    use: 'SubFormFieldModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});

SubFormFieldModel.registerFlow({
  key: 'eventSettings',
  title: tExpr('Event settings'),
  on: 'formValuesChange',
  steps: {
    linkageRules: {
      use: 'subFormFieldLinkageRules',
      afterParamsSave(ctx) {
        // 保存后，自动运行一次
        ctx.model.applyFlow('eventSettings');
      },
    },
  },
});

const ArrayNester = ({
  name,
  value,
  disabled,
  allowAddNew,
  allowSelectExistingRecord,
  onSelectExitRecordClick,
  allowDisassociation,
  allowCreate,
}: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const { t } = useTranslation();
  const rowIndex = model.context.fieldIndex || [];
  // 用来缓存每行的 fork，保证每行只创建一次
  const forksRef = useRef<Record<string, any>>({});
  const collectionName = model.context.collectionField.name;
  const getParentItem = () =>
    resolveParentItemWithFallback(
      () => (model?.parent as any)?.context,
      () => model?.context?.formValues,
    );
  const parentAccessors = createParentItemAccessorsFromContext({
    parentContextAccessor: () => (model?.parent as any)?.context,
    fallbackParentPropertiesAccessor: () => model?.context?.formValues,
  });
  useEffect(() => {
    gridModel.context.defineProperty('parentDisabled', {
      get: () => disabled,
      cache: false,
    });
  }, [disabled, gridModel.context]);

  return (
    <Card
      bordered={true}
      style={{ position: 'relative' }}
      className={css`
        > .ant-card-body > .ant-divider:last-child {
          display: none;
        }
      `}
    >
      <Form.List name={name}>
        {(fields, { add, remove }) => {
          const displayFields = fields.length === 0 ? [{ key: '0', name: 0, isDefault: true }] : fields;
          const itemLength = displayFields.length;
          return (
            <>
              {displayFields.map((field: any, index) => {
                const { key, name: fieldName, isDefault } = field;
                const fieldIndex = [...rowIndex, `${collectionName}:${index}`];

                // 每行只创建一次 fork
                if (!forksRef.current[key]) {
                  const fork = gridModel.createFork({ disabled });
                  fork.gridContainerRef = React.createRef<HTMLDivElement>();
                  fork.context.defineProperty('fieldKey', {
                    get: () => fieldIndex,
                  });
                  forksRef.current[key] = fork;
                }

                const currentFork = forksRef.current[key];

                currentFork.context.defineProperty('fieldIndex', {
                  get: () => fieldIndex,
                  cache: false,
                });

                const getRowItem = createItemChainGetter({
                  valueAccessor: () => currentFork.context.form.getFieldValue([name, fieldName]),
                  parentItemAccessor: getParentItem,
                  indexAccessor: () => index,
                  lengthAccessor: () => itemLength,
                });

                currentFork.context.defineProperty('item', {
                  get: getRowItem,
                  ...createAssociationItemChainContextPropertyOptions({
                    t: currentFork.context.t,
                    title: buildCurrentItemTitle(
                      currentFork.context.t,
                      model?.context?.collectionField,
                      model?.props?.name,
                    ),
                    showIndex: true,
                    showParentIndex: Array.isArray(rowIndex) && rowIndex.length > 0,
                    collectionAccessor: () => currentFork.context.collection,
                    propertiesAccessor: (ctx) => ctx?.item?.value,
                    resolverPropertiesAccessor: () => currentFork.context.form.getFieldValue([name, fieldName]),
                    parentCollectionAccessor: () => model?.context?.collectionField?.collection,
                    parentAccessors,
                  }),
                });
                const rowCurrentObjectOptions = currentFork.context.getPropertyOptions?.('currentObject');
                currentFork.context.defineProperty('currentObject', {
                  get: () => currentFork.context.form.getFieldValue([name, fieldName]) || {},
                  cache: false,
                  // meta: rowCurrentObjectOptions?.meta,
                  resolveOnServer: rowCurrentObjectOptions?.resolveOnServer,
                  serverOnlyWhenContextParams: rowCurrentObjectOptions?.serverOnlyWhenContextParams,
                });

                const rowValue = value?.[index];
                const removable =
                  !disabled && !isDefault && (allowDisassociation || rowValue?.__is_new__ || rowValue?.__is_stored__);

                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    {removable && (
                      <div style={{ textAlign: 'right' }}>
                        <Tooltip title={t('Remove')}>
                          <CloseOutlined
                            style={{ zIndex: 1000, color: '#a8a3a3' }}
                            onClick={() => {
                              remove(index);
                              const gridFork = forksRef.current[key];
                              // 同时销毁子模型的 fork
                              gridFork.mapSubModels('items', (item) => {
                                const cacheKey = `${gridFork.context.fieldKey}:${item.uid}`;
                                // 同时销毁子模型的 fork
                                item.subModels.field?.getFork(`${gridFork.context.fieldKey}`)?.dispose(); // 使用模板字符串把数组展开
                                item.getFork(cacheKey)?.dispose();
                              });
                              gridFork.dispose();
                              // 删除 fork 缓存
                              delete forksRef.current[key];
                            }}
                          />
                        </Tooltip>
                      </div>
                    )}

                    <FlowModelRenderer model={currentFork} showFlowSettings={false} />
                    <Divider />
                  </div>
                );
              })}

              <Space>
                {allowAddNew &&
                  (allowCreate || isConfigMode) &&
                  (allowCreate ? (
                    <Button type="link" onClick={() => add({ __is_new__: true })} disabled={disabled}>
                      <PlusOutlined />
                      {t('Add new')}
                    </Button>
                  ) : (
                    <ActionWithoutPermission
                      message={t('No permission to add new')}
                      forbidden={{ actionName: 'create' }}
                    >
                      <Button type="link" disabled>
                        <PlusOutlined />
                        {t('Add new')}
                      </Button>
                    </ActionWithoutPermission>
                  ))}
                {allowSelectExistingRecord && (
                  <Button type="link" onClick={() => onSelectExitRecordClick()} disabled={disabled}>
                    <ZoomInOutlined /> {t('Select record')}
                  </Button>
                )}
              </Space>
            </>
          );
        }}
      </Form.List>
    </Card>
  );
};

export class SubFormListFieldModel extends FormAssociationFieldModel {
  selectedRows = observable.ref([]);
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
    this.context.blockModel.emitter.on('formValuesChange', (payload) => {
      this.dispatchEvent('formValuesChange', payload, { debounce: true });
    });

    const parentAccessors = createParentItemAccessorsFromContext({
      parentContextAccessor: () => (this.parent as any)?.context,
    });

    this.context.defineProperty('item', {
      get: () => undefined,
      ...createAssociationItemChainContextPropertyOptions({
        t: this.context.t,
        title: buildCurrentItemTitle(this.context.t, this.context.collectionField, this.props.name),
        showParentIndex: Array.isArray(this.context.fieldIndex) && this.context.fieldIndex.length > 0,
        collectionAccessor: () => this.context.collection,
        propertiesAccessor: (ctx) => ctx?.item?.value,
        resolverPropertiesAccessor: () => (this.context as any)?.item?.value,
        parentCollectionAccessor: () => this.context.collectionField?.collection,
        parentAccessors,
      }),
    });

    const listCurrentObjectOptions = this.context.getPropertyOptions?.('currentObject');
    this.context.defineProperty('currentObject', {
      value: null,
      // meta: listCurrentObjectOptions?.meta,
      resolveOnServer: listCurrentObjectOptions?.resolveOnServer,
      serverOnlyWhenContextParams: listCurrentObjectOptions?.serverOnlyWhenContextParams,
    });

    this.onSelectExitRecordClick = () => {
      this.dispatchEvent('openView', {});
    };
  }

  set onSelectExitRecordClick(fn) {
    this.setProps({ onSelectExitRecordClick: fn });
  }
  change() {
    this.props.onChange(this.selectedRows.value);
  }
  onMount() {
    super.onMount();
    // 首次渲染触发一次事件流
    setTimeout(() => {
      this.applyFlow('eventSettings');
    }, 100); // TODO：待修复。不延迟的话，会导致 disabled 的状态不生效
  }
  render() {
    return <ArrayNester {...this.props} />;
  }
}

SubFormListFieldModel.define({
  label: tExpr('Subform'),
  createModelOptions: {
    use: 'SubFormListFieldModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
});

SubFormListFieldModel.registerFlow({
  key: 'subFormListSettings',
  title: tExpr('Sub-form settings'),
  sort: 200,
  steps: {
    allowAddNew: {
      title: tExpr('Enable add new action'),
      uiMode: { type: 'switch', key: 'allowAddNew' },
      defaultParams: {
        allowAddNew: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowAddNew: params.allowAddNew,
        });
      },
    },
    allowDisassociation: {
      title: tExpr('Enable remove action'),
      uiMode: { type: 'switch', key: 'allowDisassociation' },
      defaultParams: {
        allowDisassociation: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowDisassociation: params.allowDisassociation,
        });
      },
    },
    allowSelectExistingRecord: {
      title: tExpr('Enable select action'),
      uiMode: { type: 'switch', key: 'allowSelectExistingRecord' },
      defaultParams: {
        allowSelectExistingRecord: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowSelectExistingRecord: params.allowSelectExistingRecord,
        });
      },
    },
  },
});

SubFormListFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: tExpr('Selector setting'),
  on: {
    eventName: 'openView',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit popup (Select record)'),
      hideInSettings(ctx) {
        const allowSelectExistingRecord = ctx.model.getStepParams?.('subFormListSettings', 'allowSelectExistingRecord')
          ?.allowSelectExistingRecord;
        return !allowSelectExistingRecord;
      },
      uiSchema(ctx) {
        return {
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
        };
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
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
        const openMode = ctx.isMobileLayout ? 'embed' : ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.model.selectedRows.value = ctx.model.props.value || [];
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'select',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            rowSelectionProps: {
              type: 'checkbox',
              defaultSelectedRows: () => {
                return ctx.model.props.value;
              },
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                const prev = ctx.model.props.value || [];
                const merged = [
                  ...prev,
                  ...selectedRows.map((v) => {
                    return {
                      ...v,
                      __is_stored__: true,
                    };
                  }),
                ];

                // 去重，防止同一个值重复
                const unique = merged.filter(
                  (row, index, self) =>
                    index ===
                      self.findIndex(
                        (r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey],
                      ) || row.__is_new__,
                );
                ctx.model.selectedRows.value = unique;
              },
            },
          },
          content: () => <RecordPickerContent model={ctx.model} />,
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

SubFormListFieldModel.registerFlow({
  key: 'eventSettings',
  title: tExpr('Event settings'),
  on: 'formValuesChange',
  steps: {
    linkageRules: {
      use: 'subFormFieldLinkageRules',
      afterParamsSave(ctx) {
        // 保存后，自动运行一次
        ctx.model.applyFlow('eventSettings', {
          changedValues: {},
          allValues: ctx.form?.getFieldsValue(true),
        });
      },
    },
  },
});

FormItemModel.bindModelToInterface('SubFormFieldModel', ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'], {
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
  order: 100,
});

FormItemModel.bindModelToInterface('SubFormListFieldModel', ['m2m', 'o2m', 'mbm'], {
  order: 100,
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});

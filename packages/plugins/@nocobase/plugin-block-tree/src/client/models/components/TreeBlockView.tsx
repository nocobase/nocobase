/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import {
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  observer,
} from '@nocobase/flow-engine';
import type { ForkFlowModel, PropertyMetaFactory } from '@nocobase/flow-engine';
import { Checkbox, DatePicker, Input, InputNumber, Radio, Select, Space, Switch } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { Tree, TreeProps } from '../../component';
import type { TreeBlockModel } from '../TreeBlockModel';

const SEARCH_FILTER_GROUP = '__tree_search__';

const getInputValue = (value: any) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return value == null ? '' : String(value);
};

const getCommonComponentProps = (schema: any) => ({
  allowClear: true,
  placeholder: schema?.['x-component-props']?.placeholder,
  ...(schema?.['x-component-props'] || {}),
  style: {
    width: '100%',
    minWidth: 64,
    ...(schema?.['x-component-props']?.style || {}),
  },
});

const getSelectOptions = (schema: any, componentProps: any) => {
  if (Array.isArray(componentProps?.options)) {
    return componentProps.options;
  }

  if (Array.isArray(schema?.enum)) {
    return schema.enum;
  }

  return undefined;
};

const normalizeChangeValue = (input: any) => {
  if (input && typeof input === 'object' && 'target' in input) {
    return input.target?.value;
  }

  return input;
};

const omitUndefined = (props: Record<string, any> = {}) => {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));
};

const renderFilterInput = (app: any, schema: any, value: any, onChange: (value: any) => void): React.ReactElement => {
  const xComponent = schema?.['x-component'];
  const componentProps = getCommonComponentProps(schema);

  if (!xComponent || xComponent === 'Input') {
    return (
      <Input {...componentProps} value={getInputValue(value)} onChange={(event) => onChange(event.target.value)} />
    );
  }

  if (xComponent === 'InputNumber') {
    return (
      <InputNumber {...componentProps} value={typeof value === 'number' ? value : undefined} onChange={onChange} />
    );
  }

  if (xComponent === 'Select') {
    return (
      <Select
        {...componentProps}
        options={getSelectOptions(schema, componentProps)}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (xComponent === 'Switch') {
    return <Switch {...componentProps} checked={!!value} onChange={onChange} />;
  }

  if (xComponent === 'Checkbox') {
    return <Checkbox {...componentProps} checked={!!value} onChange={(event) => onChange(event.target.checked)} />;
  }

  if (xComponent === 'Checkbox.Group') {
    return <Checkbox.Group {...componentProps} value={Array.isArray(value) ? value : undefined} onChange={onChange} />;
  }

  if (xComponent === 'Radio.Group') {
    return <Radio.Group {...componentProps} value={value} onChange={(event) => onChange(event.target.value)} />;
  }

  if (xComponent === 'DatePicker') {
    return <DatePicker {...componentProps} value={value} onChange={onChange} />;
  }

  if (xComponent === 'Input.TextArea' || xComponent === 'TextArea') {
    return (
      <Input.TextArea
        {...componentProps}
        value={getInputValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (xComponent) {
    const Component = app?.getComponent?.(xComponent);
    if (Component) {
      return <Component {...componentProps} value={value} onChange={(next) => onChange(normalizeChangeValue(next))} />;
    }
  }

  return <Input {...componentProps} value={getInputValue(value)} onChange={(event) => onChange(event.target.value)} />;
};

const collectDescendantKeys = (node: any, keyName: string, keys: React.Key[] = []) => {
  if (!node) {
    return keys;
  }

  const keyValue = node[keyName];
  if (keyValue !== null && keyValue !== undefined) {
    keys.push(keyValue);
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    collectDescendantKeys(child, keyName, keys);
  }

  return keys;
};

const findNodeByKey = (treeData: any[], keyName: string, targetKey: React.Key): any => {
  for (const node of treeData || []) {
    if (node?.[keyName] === targetKey) {
      return node;
    }

    const childNode = findNodeByKey(node?.children || [], keyName, targetKey);
    if (childNode) {
      return childNode;
    }
  }

  return null;
};

const recordIdentityByFork = new WeakMap<ForkFlowModel<any>, string>();

const getRecordIdentity = (model: TreeBlockModel, record: any, fallbackKey: string) => {
  const recordKey = model.collection?.getFilterByTK?.(record);

  if (recordKey !== undefined && recordKey !== null) {
    return String(recordKey);
  }

  if (
    record?.[model.collection?.filterTargetKey] !== undefined &&
    record?.[model.collection?.filterTargetKey] !== null
  ) {
    return String(record[model.collection.filterTargetKey]);
  }

  return fallbackKey;
};

const getTreeParentField = (model: TreeBlockModel) => {
  return (
    model.collection?.getFields?.().find((field: any) => field?.treeParent) || model.collection?.getField?.('parent')
  );
};

const getTreeNodePrimaryKeyValue = (model: TreeBlockModel, record: any) => {
  const keyName = model.collection?.filterTargetKey || model.getFieldNames().key || 'id';
  if (Array.isArray(keyName)) {
    return model.collection?.getFilterByTK?.(record);
  }
  return record?.[keyName] ?? record?.id;
};

const enhanceTreeNodeActionInputArgs = (model: TreeBlockModel, action: any, record: any) => {
  if (action?.use !== 'AddChildActionModel') {
    return record;
  }

  const sourceId = getTreeNodePrimaryKeyValue(model, record);
  if (sourceId === undefined || sourceId === null) {
    return record;
  }

  const parentField = getTreeParentField(model);
  const parentFieldName = parentField?.name || 'parent';
  const parentForeignKey = parentField?.foreignKey || parentField?.options?.foreignKey || 'parentId';
  const formData = {
    [parentFieldName]: record,
    [parentForeignKey]: sourceId,
  };
  const cachedFormData = model.getTreeAddChildFormData?.(action?.uid, sourceId);

  if (!record?.triggerByRouter) {
    model.setTreeAddChildFormData?.(action?.uid, sourceId, formData);
  }
  const formDataInputKey = model.getTreeAddChildFormDataInputKey?.();
  const resolvedFormData = cachedFormData || formData;
  const formDataInputArg = formDataInputKey && resolvedFormData ? { [formDataInputKey]: resolvedFormData } : {};

  const enhancedRecord = {
    ...record,
    id: record?.id ?? sourceId,
    associationName: `${model.collection?.name}.children`,
    collectionName: model.collection?.name,
    dataSourceKey: model.collection?.dataSourceKey,
    sourceId,
    filterByTk: null,
    ...formDataInputArg,
    ...(!record?.triggerByRouter ? { formData } : {}),
  };

  return {
    ...enhancedRecord,
    associationName: `${model.collection?.name}.children`,
    collectionName: model.collection?.name,
    dataSourceKey: model.collection?.dataSourceKey,
    sourceId,
    filterByTk: null,
    record: enhancedRecord,
    ...formDataInputArg,
    ...(!record?.triggerByRouter ? { formData } : {}),
  };
};

const TreeNodeActions = observer(({ model, record }: { model: TreeBlockModel; record: any }) => {
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const container = model.getNodeActionsContainer();

  if (!isConfigMode && !container.hasSubModel('actions')) {
    return null;
  }

  const slotKey = String(record?.[model.getFieldNames().key] ?? record?.__index ?? record?.id ?? 'node');
  const recordIdentity = getRecordIdentity(model, record, slotKey);

  return (
    <DndProvider>
      <Space
        size={0}
        wrap
        onClick={(event) => event.stopPropagation()}
        className={css`
          display: inline-flex;
          justify-content: flex-end;
          opacity: ${isConfigMode ? 1 : 0};
          pointer-events: ${isConfigMode ? 'auto' : 'none'};
          transition: opacity 0.16s ease;

          button {
            padding: 0 4px;
          }
        `}
      >
        {container.mapSubModels('actions', (action: any) => {
          const cachedFork = action.getFork(slotKey);
          if (cachedFork && recordIdentityByFork.get(cachedFork) !== recordIdentity) {
            cachedFork.dispose();
          }

          const fork = action.createFork({}, slotKey);
          recordIdentityByFork.set(fork, recordIdentity);
          fork.invalidateFlowCache('beforeRender');

          if (fork.hidden && !isConfigMode) {
            return;
          }

          const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
            () => (fork.context as any).collection,
            fork.context.t('Current record'),
            (ctx) => {
              const coll = ctx.collection;
              const rec = ctx.record;
              const name = coll?.name;
              const dataSourceKey = coll?.dataSourceKey;
              const filterByTk = coll?.getFilterByTK?.(rec);
              if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
              return { collection: name, dataSourceKey, filterByTk };
            },
          );
          const inputArgs = enhanceTreeNodeActionInputArgs(model, action, record);
          const contextRecord = action?.use === 'AddChildActionModel' ? inputArgs.record || record : record;

          fork.context.defineProperty('record', {
            get: () => contextRecord,
            cache: false,
            resolveOnServer: createRecordResolveOnServerWithLocal(
              () => (fork.context as any).collection,
              () => contextRecord,
            ),
            meta: recordMeta,
          });

          const renderer = (
            <FlowModelRenderer
              key={fork.uid}
              model={fork}
              inputArgs={inputArgs}
              showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
              extraToolbarItems={[
                {
                  key: 'drag-handler',
                  component: DragHandler,
                  sort: 1,
                },
              ]}
            />
          );

          if (!isConfigMode) {
            return renderer;
          }

          return (
            <Droppable model={fork} key={fork.uid}>
              {renderer}
            </Droppable>
          );
        })}
        {model.renderConfigureNodeActions()}
      </Space>
    </DndProvider>
  );
});

const TreeNodeTitleContent = ({
  model,
  record,
  title,
}: {
  model: TreeBlockModel;
  record: any;
  title: React.ReactNode;
}) => {
  return (
    <span
      className={css`
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-width: 0;
      `}
    >
      <span
        className={css`
          min-width: 0;
          flex: 1;
        `}
      >
        {model.renderTitleFieldSettings(<span>{title}</span>)}
      </span>
      <span
        className={css`
          display: inline-flex;
          flex-shrink: 0;
          justify-content: flex-end;
          margin-left: auto;

          &:hover {
            > * {
              opacity: 1;
              pointer-events: auto;
            }
          }
        `}
      >
        <TreeNodeActions model={model} record={record} />
      </span>
    </span>
  );
};

export const TreeBlockView = observer(({ model }: { model: TreeBlockModel }) => {
  const resource = model.resource;
  const collection = model.collection;
  const collectionFilterTargetKey = collection?.filterTargetKey;
  const propsFieldNames = model.props?.fieldNames;
  const fieldNames = useMemo(
    () => ({
      key: collectionFilterTargetKey,
      title: propsFieldNames?.title || collectionFilterTargetKey,
      children: 'children',
      ...(propsFieldNames || {}),
    }),
    [collectionFilterTargetKey, propsFieldNames],
  );
  const titleField = fieldNames.title;
  const collectionField = collection?.getField?.(titleField);
  const titleFieldModel = model.getTitleFieldSettingsContainer().subModels.field as any;
  const filterFieldInterface = collectionField?.interface
    ? model.context.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(collectionField.interface)
    : null;
  const operator = filterFieldInterface?.filterable?.operators?.[0];

  const schema = useMemo(() => {
    return {
      ...collectionField?.uiSchema,
      ...operator?.schema,
    };
  }, [collectionField, operator]);

  const FilterComponent = useCallback<TreeProps['FilterComponent']>(
    ({ value, onChange }) => {
      return renderFilterInput(model.context.app, schema, value, onChange);
    },
    [model.context.app, schema],
  );

  const onSearch = useCallback<NonNullable<TreeProps['onSearch']>>(
    (value) => {
      if (!resource) {
        return;
      }

      if (value === '' || value == null) {
        resource.removeFilterGroup(SEARCH_FILTER_GROUP);
      } else {
        resource.addFilterGroup(SEARCH_FILTER_GROUP, {
          [titleField]: {
            [operator?.value || '$eq']: value,
          },
        });
      }

      resource.setPage(1);
      void resource.refresh();
    },
    [operator?.value, resource, titleField],
  );

  const onSelect = useCallback<NonNullable<TreeProps['onSelect']>>(
    (selectedKeys) => {
      const nextSelectedKeys = selectedKeys as React.Key[];
      model.setSelectedKeys(nextSelectedKeys);

      const selectedKey = nextSelectedKeys?.[0];
      if (selectedKey === undefined || selectedKey === null) {
        model.setSelectedFilterValues([]);
      } else {
        const selectedNode = findNodeByKey(resource.getData() || [], fieldNames.key, selectedKey);
        const keys = collectDescendantKeys(selectedNode, fieldNames.key, []);
        model.setSelectedFilterValues(keys.length ? keys : [selectedKey]);
      }

      void model.context.filterManager?.refreshTargetsByFilter?.(model.uid);
    },
    [fieldNames.key, model, resource],
  );

  const renderNodeTitle = useCallback<NonNullable<TreeProps['renderNodeTitle']>>(
    (value, node, fallbackTitle) => {
      if (value === null || value === undefined || value === '') {
        return <TreeNodeTitleContent model={model} record={node} title="N/A" />;
      }

      if (!titleFieldModel?.createFork || !collectionField) {
        return <TreeNodeTitleContent model={model} record={node} title={fallbackTitle || String(value)} />;
      }

      const nodeKey = node?.[fieldNames.key] ?? `${titleField}-${String(value)}`;
      const fieldModel = titleFieldModel.createFork({}, String(nodeKey));

      fieldModel.context.defineProperty('collectionField', {
        get: () => collectionField,
        cache: false,
      });

      fieldModel.context.defineProperty('record', {
        get: () => node,
        cache: false,
      });

      fieldModel.setProps({
        ...omitUndefined(collectionField.getComponentProps()),
        value,
        clickToOpen: false,
      });

      const rendered =
        fallbackTitle ||
        (typeof fieldModel.render === 'function' ? fieldModel.render() : fieldModel.renderComponent?.(value));

      return <TreeNodeTitleContent model={model} record={node} title={rendered ?? String(value)} />;
    },
    [collectionField, fieldNames.key, model, titleField, titleFieldModel],
  );

  const containerStyle =
    model.decoratorProps?.heightMode === 'specifyValue' || model.decoratorProps?.heightMode === 'fullHeight'
      ? { height: '100%', overflow: 'auto' as const }
      : undefined;
  const { includeDescendants: _includeDescendants, ...treeProps } = model.props || {};

  return (
    <div
      style={containerStyle}
      className={css`
        .ant-tree-treenode {
          width: 100%;
        }

        .ant-tree-switcher {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .ant-tree-node-content-wrapper {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
        }

        .ant-tree-title {
          display: block;
          width: 100%;
        }

        .ant-tree-treenode:hover {
          .ant-tree-title {
            > span > span:last-child > * {
              opacity: 1;
              pointer-events: auto;
            }
          }
        }
      `}
    >
      <Tree
        {...treeProps}
        showLine
        searchable={model.props.searchable ?? true}
        defaultExpandAll={model.props.defaultExpandAll ?? false}
        fieldNames={fieldNames}
        treeData={resource.getData()}
        loading={resource.loading}
        selectedKeys={model.selectedKeys.value}
        onSearch={onSearch}
        onSelect={onSelect}
        FilterComponent={FilterComponent}
        renderNodeTitle={renderNodeTitle}
        searchExtra={model.renderActions()}
      />
    </div>
  );
});

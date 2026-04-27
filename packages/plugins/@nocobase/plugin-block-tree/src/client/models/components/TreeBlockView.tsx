/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { Checkbox, DatePicker, Input, InputNumber, Radio, Select, Switch } from 'antd';
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
    minWidth: 150,
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
  const titleFieldModel = model.subModels.field as any;
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
    (value, node) => {
      if (value === null || value === undefined || value === '') {
        return 'N/A';
      }

      if (!titleFieldModel?.createFork || !collectionField) {
        return String(value);
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
        typeof fieldModel.render === 'function' ? fieldModel.render() : fieldModel.renderComponent?.(value);

      return <span>{rendered ?? String(value)}</span>;
    },
    [collectionField, fieldNames.key, titleField, titleFieldModel],
  );

  const containerStyle =
    model.decoratorProps?.heightMode === 'specifyValue' || model.decoratorProps?.heightMode === 'fullHeight'
      ? { height: '100%', overflow: 'auto' as const }
      : undefined;
  const { includeDescendants: _includeDescendants, ...treeProps } = model.props || {};

  return (
    <div style={containerStyle}>
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
      />
    </div>
  );
});

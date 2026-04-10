/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterContext, FilterDynamicComponent } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import React, { useCallback, useMemo } from 'react';
import { Tree, TreeProps } from '../../component';
import type { TreeBlockModel } from '../TreeBlockModel';

const SEARCH_FILTER_GROUP = '__tree_search__';

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
  const fieldNames = model.getFieldNames();
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
      return (
        <FilterContext.Provider value={{}}>
          <FilterDynamicComponent
            value={value}
            schema={schema}
            collectionField={collectionField}
            onChange={onChange}
            style={{ width: '100%' }}
            componentProps={{ allowClear: true }}
          />
        </FilterContext.Provider>
      );
    },
    [collectionField, schema],
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
        ...collectionField.getComponentProps(),
        value,
        clickToOpen: false,
      });

      const rendered =
        typeof fieldModel.renderComponent === 'function' ? fieldModel.renderComponent(value) : fieldModel.render?.();

      return <span style={{ pointerEvents: 'none' }}>{rendered ?? String(value)}</span>;
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

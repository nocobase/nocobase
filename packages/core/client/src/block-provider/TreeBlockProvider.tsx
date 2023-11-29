import { ArrayField, createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FixedBlockWrapper, SchemaComponentOptions, removeNullCondition } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { findFilterTargets } from './hooks';
import { mergeFilter } from './SharedFilterProvider';
import { useFilterBlock } from '../filter-provider';

// 创建一个Context对象，该对象可以用于在组件树中传递数据。当React渲染一个订阅了这个Context对象的组件时，这个组件会从组件树中离自身最近的那个匹配的Provider中读取到当前的context值。
export const TreeBlockContext = createContext<any>({});

const InternalTreeBlockProvider = (props) => {
  const { params, showIndex, fieldNames, ...others } = props;
  const field: any = useField();
  const { resource, service } = useBlockRequestContext();
  const [expandFlag, setExpandFlag] = useState(false);
  return (
    <FixedBlockWrapper>
      <TreeBlockContext.Provider
        value={{
          ...others,
          field,
          service,
          resource,
          params,
          expandFlag,
          setExpandFlag: () => setExpandFlag(!expandFlag),
        }}
      >
        <RenderChildrenWithAssociationFilter {...props} />
      </TreeBlockContext.Provider>
    </FixedBlockWrapper>
  );
};

export const TreeBlockProvider = (props) => {
  const params = { ...props.params };
  params.tree = true
  // const form = useMemo(() => createForm(), []);
  return (
    <BlockProvider {...props} params={params} runWhenParamsChanged>
      <InternalTreeBlockProvider {...props} params={params} />
    </BlockProvider>
  );
};
// 用于传递 上下文后续
export const useTreeBlockContext = () => {
  return useContext(TreeBlockContext);
};
function getDescendants(tree, targetId) {
  let result = [];

  function traverse(node, pId) {
    if (node.id === pId) {
      result.push(node.id);
      if (node.children) {
        for (let child of node.children) {
          traverse(child, child.id);
        }
      }
    } else if (node.children) {
      for (let child of node.children) {
        traverse(child, targetId);
      }
    }
  }

  for (let node of tree) {
    traverse(node, targetId);
  }

  return result;
}
function buildTree(data) {
  data?.forEach(item => {
    item.title = item.id
    item.key = item.id
    buildTree(item?.children || [])
  })

  return data
}

export const useTreeBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTreeBlockContext();
  const fieldSchema = useFieldSchema()
  const { getDataBlocks } = useFilterBlock()
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.data = field.data || {}
      field.data.treeData = buildTree(ctx?.service?.data?.data || [])
    }
  }, [ctx?.service?.loading]);
  return {
    loading: ctx?.service?.loading,
    onSelectNode: (selectedKeys, {selected}) => {
      const { targets, uid } = findFilterTargets(fieldSchema) 
      const dataBlocks = getDataBlocks()
      dataBlocks?.forEach((block) => {
        // 匹配当前连接的数据模块
        const target = targets.find((target) => target.uid === block.uid);
        if (!target) return;
        // 获取当前数据模块的入参
        const param = block.service.params?.[0] || {};
        // 保留原有的 filter
        const storedFilter = block.service.params?.[1]?.filters || {};
        const ids = getDescendants(field.data.treeData, selectedKeys[0])
        storedFilter[uid] = {
          $or: selected?ids.map(id => ({
            [target.field || 'id']: {
              ['$eq']: id,
            },
          })):[]
        };

        const mergedFilter = mergeFilter([
          ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
          block.defaultFilter,
        ]);

        return block.doFilter(
          {
            ...param,
            page: 1,
            filter: mergedFilter,
          },
          { filters: storedFilter },
        );
      });
    }
  };
};
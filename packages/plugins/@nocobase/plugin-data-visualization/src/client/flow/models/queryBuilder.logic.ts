/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { FormCollapse } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { theme } from 'antd';
import { useT } from '../../locale';
import { DEFAULT_DATA_SOURCE_KEY, useDataSourceManager } from '@nocobase/client';
import { formatters } from '../utils';

export const useQueryBuilderLogic = () => {
  const t = useT();
  const form = useForm();
  const { token } = theme.useToken();
  const dm = useDataSourceManager();

  // 读取当前选择的数据源与集合
  const collectionPath: string[] | undefined = form?.values?.settings?.collection;
  const [dataSourceKey, collectionName] = collectionPath || [];
  const ds = dm.getDataSource(dataSourceKey || DEFAULT_DATA_SOURCE_KEY);
  const cm = ds?.collectionManager;
  const fim = dm.collectionFieldInterfaceManager;

  // 构建集合选项（数据源 -> 集合），不再进行 ACL 过滤
  const collectionOptions = useMemo(() => {
    const allCollections = dm.getAllCollections();
    return allCollections
      .filter(({ key, isDBInstance }) => key === DEFAULT_DATA_SOURCE_KEY || isDBInstance)
      .map(({ key, displayName, collections }) => ({
        value: key,
        label: displayName,
        children: (collections || []).map((c) => ({
          value: c.name,
          label: c.title ?? c.name,
        })),
      }));
  }, [dm]);

  // 工具：拼接级联字段别名
  const aliasOf = (val: any): string => {
    if (Array.isArray(val)) return val.filter(Boolean).join('.');
    return val ? String(val) : '';
  };

  // 字段树（用于 Cascader）：最多一层关联
  const fieldOptions = useMemo(() => {
    if (!cm || !fim || !collectionName) return [];
    const collectionFields = cm.getCollectionFields(collectionName) || [];

    const toOption = (field: any, depth: number, prefix?: string) => {
      if (!field?.interface) return undefined;
      const iface = fim.getFieldInterface(field.interface);
      if (!iface?.filterable) return undefined;

      const value = prefix ? `${prefix}.${field.name}` : field.name;
      const opt: any = {
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        key: value,
        value: field.name,
      };

      // 限制最大深度为 1（与原 QueryBuilder 使用一致）
      if (depth >= 1) {
        // children: filterable.children（如 year/month 等虚拟子项）
        const children = iface.filterable?.children || [];
        if (children.length) {
          opt.children = children.map((c: any) => ({
            ...c,
            key: `${field.name}.${c.name}`,
            value: c.name,
          }));
        }
        // 关联目标字段作为 children
        if (iface.filterable?.nested && field.target) {
          const targetFields = cm.getCollectionFields(field.target) || [];
          const nested = targetFields.map((tf) => toOption(tf, depth + 1, field.name)).filter(Boolean);
          opt.children = [...(opt.children || []), ...nested];
        }
      }

      return opt;
    };

    return collectionFields.map((f) => toOption(f, 0)).filter(Boolean);
  }, [cm, fim, collectionName, form?.values?.settings?.collection]);

  // 过滤器字段与操作符（Filter 用）：最多两层关联
  const filterOptions = useMemo(() => {
    if (!cm || !fim || !collectionName) return [];
    const fields = cm.getCollectionFields(collectionName) || [];

    const toOption = (field: any, depth: number): any => {
      if (!field?.interface) return undefined;
      const iface = fim.getFieldInterface(field.interface);
      if (!iface?.filterable) return undefined;

      const ops = (iface.filterable.operators || []).filter((op: any) => !op?.visible || op.visible(field)) || [];

      const opt: any = {
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        schema: field?.uiSchema,
        operators: ops,
        interface: field.interface,
      };

      if (depth >= 2) return opt;

      // children: filterable.children（虚拟）
      if (iface.filterable?.children?.length) {
        opt.children = iface.filterable.children;
      }

      // 嵌套关联
      if (iface.filterable?.nested && field.target) {
        const targetFields = cm.getCollectionFields(field.target) || [];
        const nested = targetFields.map((tf) => toOption(tf, depth + 1)).filter(Boolean);
        opt.children = [...(opt.children || []), ...nested];
      }

      return opt;
    };

    return fields.map((f) => toOption(f, 0)).filter(Boolean);
  }, [cm, fim, collectionName, form?.values?.settings?.collection]);

  // 根据字段别名推断 interface（仅处理实际字段/一层关联）
  const getInterfaceByAlias = (alias: string): string | undefined => {
    if (!alias || !cm || !collectionName) return;
    const parts = alias.split('.');
    const [first, second] = parts;

    const rootFields = cm.getCollectionFields(collectionName) || [];
    const root = rootFields.find((f) => f.name === first);
    if (!root) return;

    if (!second) return root.interface;

    if (root.target) {
      const targetFields = cm.getCollectionFields(root.target) || [];
      const child = targetFields.find((f) => f.name === second);
      return child?.interface;
    }
    return undefined;
  };

  // 维度格式化选项 reactions
  const useFormatterOptions = (field: any) => {
    const selected = field.query('.field').get('value');
    const alias = aliasOf(selected);
    if (!alias) {
      field.dataSource = [];
      return;
    }
    const iface = getInterfaceByAlias(alias);
    switch (iface) {
      case 'datetime':
      case 'datetimeTz':
      case 'unixTimestamp':
      case 'datetimeNoTz':
      case 'createdAt':
      case 'updatedAt':
        field.dataSource = formatters.datetime;
        return;
      case 'date':
        field.dataSource = formatters.date;
        return;
      case 'time':
        field.dataSource = formatters.time;
        return;
      default:
        field.dataSource = [];
    }
  };

  // 展开 fieldOptions 为别名集合（非聚合排序用）
  const flattenAllAliases = (options: any[], prefix?: string): string[] => {
    const acc: string[] = [];
    options.forEach((opt) => {
      const self = prefix ? `${prefix}.${opt.value || opt.name}` : opt.value || opt.name;
      if (opt.children?.length) {
        acc.push(...flattenAllAliases(opt.children, opt.name));
      } else if (self) {
        acc.push(self);
      }
    });
    return acc;
  };

  // 从当前表单 query 中提取选中的字段别名（聚合时作为排序字段列表）
  const getSelectedAliases = (query: any): string[] => {
    const aliases: string[] = [];
    const dims = query?.dimensions || [];
    const meas = query?.measures || [];

    dims.forEach((d: any) => {
      const a = aliasOf(d?.field);
      if (a) aliases.push(a);
    });
    meas.forEach((m: any) => {
      const a = m?.alias || aliasOf(m?.field);
      if (a) aliases.push(a);
    });

    // 去重
    return Array.from(new Set(aliases));
  };

  // 排序字段候选 reactions
  const useOrderOptions = (field: any) => {
    const query = field.query('query').get('value') || {};
    const hasAgg = (query.measures || []).some((m: any) => !!m?.aggregation);

    if (hasAgg) {
      // 聚合：排序字段为维度与度量（用别名表示）
      const selected = getSelectedAliases(query);
      field.componentProps.fieldNames = {}; // 扁平 options
      field.dataSource = selected.map((v) => ({ label: v, value: v }));
      return;
    }

    // 非聚合：使用完整字段树
    field.componentProps.fieldNames = { label: 'title', value: 'name', children: 'children' };
    field.dataSource = fieldOptions;
  };

  // 排序数组合法性校验 reactions
  const useOrderReactionHook = (arrayField: any) => {
    const query = arrayField.query('query').get('value') || {};
    const hasAgg = (query.measures || []).some((m: any) => !!m?.aggregation);

    const allowed = hasAgg ? new Set(getSelectedAliases(query)) : new Set(flattenAllAliases(fieldOptions));

    const orders = arrayField.value || [];
    const next = orders.filter((item: any) => {
      const a = aliasOf(item?.field);
      // 修复点：未选择字段（a 为空）时保留该条目，避免刚 push 就被清洗掉
      if (!a) return true;
      return allowed.has(a);
    });

    // 仅在结果有变化时再写回，避免不必要的 set
    const changed = next.length !== orders.length || next.some((v: any, i: number) => v !== orders[i]);
    if (changed) {
      arrayField.setValue(next);
    }
  };

  // 切换集合：清空 builder 配置
  const onCollectionChange = (value: string[]) => {
    form.setValues({
      ...form.values,
      settings: {
        ...(form.values?.settings || {}),
        collection: value,
      },
      query: {
        ...(form.values?.query || {}),
        builder: {
          measures: [],
          dimensions: [],
          filter: undefined,
          orders: [],
        },
      },
    });
  };

  return {
    t,
    token,
    // 暴露给 UI 的数据与 reactions
    collectionOptions,
    fieldOptions,
    filterOptions,
    formCollapse: FormCollapse.createFormCollapse(['measures', 'dimensions', 'filter', 'sort']),
    useFormatterOptions,
    useOrderOptions,
    useOrderReactionHook,
    onCollectionChange,
  };
};

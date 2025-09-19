/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { ArrayItems, FormCollapse, FormItem, Space, Switch, Cascader, Select, Input, Checkbox } from '@formily/antd-v5';
import { Schema, useForm } from '@formily/react';
import { SchemaComponent, InputNumber, Filter } from '@nocobase/client';
import { theme } from 'antd';
import { useT } from '../../locale';
import { querySchema } from '../../configure/schemas/configure';
import {
  useCollectionFieldsOptions,
  useCollectionFilterOptions,
  useCollectionOptions,
  useFieldsWithAssociation,
  useFormatters,
  useOrderFieldsOptions,
  useOrderReaction,
} from '../../hooks';
import { FilterDynamicComponent } from '../../configure/FilterDynamicComponent';

export const QueryBuilder: React.FC = () => {
  const t = useT();
  const form = useForm();
  const { token } = theme.useToken();

  // 获取当前选中的数据源/集合（来自 schema: settings.collection 的 Cascader）
  const collectionPath: string[] | undefined = form?.values?.settings?.collection;
  const [dataSource, collection] = collectionPath || [];

  // 计算 schema scope 所需的数据与方法
  const fields = useFieldsWithAssociation(dataSource, collection);
  const fieldOptionsRaw = useCollectionFieldsOptions(dataSource, collection, 1);
  const fieldOptions = useMemo(() => Schema.compile(fieldOptionsRaw, { t }), [fieldOptionsRaw, t]);
  const filterOptions = useCollectionFilterOptions(dataSource, collection);
  const collectionOptions = useCollectionOptions();
  const formCollapse = FormCollapse.createFormCollapse(['measures', 'dimensions', 'filter', 'sort']);

  const useFormatterOptions = useFormatters(fields);
  const useOrderOptions = useOrderFieldsOptions(fieldOptions, fields);
  const useOrderReactionHook = useOrderReaction(fieldOptions, fields);

  // 切换集合时，清空 builder 查询配置，避免跨集合污染
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

  return (
    <SchemaComponent
      schema={querySchema}
      scope={{
        t,
        formCollapse,
        fieldOptions,
        filterOptions,
        useOrderOptions,
        collectionOptions,
        useFormatterOptions,
        onCollectionChange,
        collection,
        useOrderReaction: useOrderReactionHook,
        collapsePanelBg: token.colorBgContainer,
      }}
      components={{
        ArrayItems,
        FormCollapse,
        FormItem,
        Space,
        Cascader,
        Select,
        Input,
        InputNumber,
        Checkbox,
        Switch,
        Filter,
        FilterDynamicComponent,
      }}
    />
  );
};

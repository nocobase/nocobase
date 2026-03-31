/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { useForm } from '@formily/react';
import {
  ActionProps,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockResource,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';

export const useFlowModelTemplateSearchProps = () => {
  const { service } = useBlockRequestContext();
  const t = useT();
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const current = service?.params?.[0]?.search;
    setKeyword(current || '');
  }, [service?.params]);

  const doSearch = useCallback(
    (value: string) => {
      const params = { ...(service?.params?.[0] || {}) };
      if (value) {
        params.search = value;
      } else {
        delete params.search;
      }
      service?.run?.({ ...params, page: 1 });
    },
    [service],
  );

  return {
    placeholder: t('Search templates'),
    value: keyword,
    onChange: (e: any) => {
      const next = e?.target?.value ?? '';
      setKeyword(next);
      if (!next) {
        doSearch('');
      }
    },
    onSearch: (value: string) => doSearch(value?.trim?.() || ''),
    allowClear: true,
    style: { width: 260 },
  };
};

export const useFlowModelTemplateEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [recordData],
  );

  return {
    form,
  };
};

export const useFlowModelTemplateEditActionProps = (): ActionProps => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const { service } = useBlockRequestContext();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.update({
        values: {
          name: values.name,
          description: values.description,
        },
        filterByTk: values[collection.filterTargetKey],
      });
      await service?.refresh?.();
      message.success(t('Saved'));
      setVisible?.(false);
    },
  };
};

export const useFlowModelTemplateDeleteActionProps = (): ActionProps => {
  const record = useCollectionRecordData();
  const collection = useCollection();
  const resource = useDataBlockResource();
  const { service } = useBlockRequestContext();
  const { message } = AntdApp.useApp();
  const t = useT();

  const inUse = (record?.usageCount || 0) > 0;

  return {
    danger: true,
    disabled: inUse,
    confirm: inUse
      ? undefined
      : {
          title: t('Delete template'),
          content: t('Are you sure you want to delete this item? This action cannot be undone.'),
        },
    async onClick() {
      if (inUse) {
        message.warning(t('Template is in use and cannot be deleted'));
        return;
      }
      await resource.destroy({
        filterByTk: record?.[collection.filterTargetKey],
      });
      await service?.refresh?.();
      message.success(t('Deleted'));
    },
  };
};

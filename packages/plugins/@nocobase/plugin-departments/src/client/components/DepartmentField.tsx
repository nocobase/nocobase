/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { TreeSelect, Tooltip, Dropdown, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useDepartmentManager } from '../hooks/departments-manager';
import {
  useRequest,
  AssociationField,
  useCollectionRecord,
  useAPIClient,
  useDataBlockRequestGetter,
} from '@nocobase/client';
import { useField, useForm, connect, mapReadPretty } from '@formily/react';
import isEmpty from 'lodash/isEmpty';
import { Field, onFormSubmitStart, onFormSubmitFailed } from '@formily/core';
import { uid } from '@formily/shared';
import { useDepartmentTranslation } from '../locale';

export const DepartmentField = connect((props) => {
  const { t } = useDepartmentTranslation();
  const { showMainDepartmentSet } = props;
  const { treeData, nodeMap, initData, loadData } = useDepartmentManager() || {};
  const form = useForm();
  const field = useField<Field>();
  const record: any = useCollectionRecord();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const api = useAPIClient();
  const [value, setValue] = useState([]);

  const submitFlagRef = useRef(false);
  const mainIdRef = useRef('');
  const originMainIdRef = useRef('');
  const formTokenRef = useRef(uid());

  const initialIndex = useMemo(() => {
    const arr = Array.isArray(field.initialValue) ? field.initialValue : [];
    const map = new Map();
    arr.forEach((item) => {
      if (item && item.id != null) {
        map.set(item.id, item);
      }
    });
    return map;
  }, [field.initialValue]);

  const dropdownItems = useMemo(() => {
    return value.map((item) => ({ label: item.label, key: item.value }));
  }, [value]);

  const departmentRequest = {
    resource: 'departments',
    action: 'list',
    params: {
      paginate: false,
      filter: {
        parentId: null,
      },
    },
  };
  const { data }: any = useRequest(departmentRequest);

  useEffect(() => {
    if (!isEmpty(field.value)) {
      const defaultValue = field.value.map((item) => {
        return {
          label: item.title,
          value: item.id,
        };
      });
      setValue(defaultValue);
    }
    const main = record?.data?.departments?.flatMap((d) => d?.departmentsUsers || [])?.find((u) => u?.isMain);
    const id = main?.departmentId ?? '';
    originMainIdRef.current = id;
    mainIdRef.current = id;
  }, []);

  useEffect(() => {
    if (data) {
      initData(data?.data);
    }
  }, [data]);

  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      onFormSubmitStart(() => {
        submitFlagRef.current = true;
      });
      onFormSubmitFailed(() => {
        submitFlagRef.current = false;
      });
    });
    return () => form.removeEffects(id);
  }, [form]);

  // onFormSubmitSuccess无法处理， 改用拦截器
  useEffect(() => {
    // 请求拦截器绑定本次表单提交请求，确保仅在本次提交时生效，防止误命中
    const reqId = api.axios.interceptors.request.use((config) => {
      const url = config?.url || '';
      const method = (config?.method || '').toLowerCase();
      const isUsersWrite =
        (url === 'users:update' || url === 'users:create') && ['post', 'put', 'patch'].includes(method);
      if (submitFlagRef.current && isUsersWrite) {
        if (config.headers) {
          config.headers['X-MainDept-Form'] = formTokenRef.current;
        }
      }
      return config;
    });

    const respId = api.axios.interceptors.response.use(
      async (resp) => {
        if (!submitFlagRef.current) return resp;
        const token = resp?.config?.headers?.['X-MainDept-Form'];
        const fromThisForm = token === formTokenRef.current;
        if (!fromThisForm) return resp;
        const url = resp?.config?.url || '';

        submitFlagRef.current = false;
        const userId = url === 'users:update' ? resp?.data?.data?.[0].id : resp?.data?.data?.id;
        const mainId = mainIdRef.current;
        const originId = originMainIdRef.current;
        if (showMainDepartmentSet && userId && mainId && String(mainId) !== String(originId)) {
          try {
            await api.resource('users').setMainDepartment({
              values: { userId, departmentId: Number(mainId) },
            });
            getDataBlockRequest()?.refresh?.();
          } catch (e) {
            message.error(e.message);
          }
        }
        return resp;
      },
      (error) => {
        // 避免其他请求报错导致重置submitFlagRef
        const token = error?.config?.headers?.['X-MainDept-Form'];
        if (token === formTokenRef.current) {
          submitFlagRef.current = false;
        }
        return Promise.reject(error);
      },
    );
    return () => {
      api.axios.interceptors.request.eject(reqId);
      api.axios.interceptors.response.eject(respId);
    };
  }, [api]);

  const handleLoadData = async (dataNode) => {
    if (dataNode.children?.length) {
      return;
    }
    await loadData({ key: dataNode.key, children: dataNode.children });
  };

  const sanitize = (obj) => {
    if (!obj) return obj;
    const { childrenMap, parent, ...rest } = obj || {};
    return rest;
  };

  // 优先从 nodeMap 读取，其次用 initialValue 兜底,防止编辑表单时，未懒加载的节点信息未补全
  const pickById = (id) => {
    return nodeMap?.[id] ?? initialIndex.get(id);
  };

  const onChange = (newValue) => {
    setValue(newValue);
    const ids = newValue.map((item) => {
      return item.value;
    });
    const propsValue = ids.map((id) => sanitize(pickById(id))).filter(Boolean);
    props.onChange?.(propsValue);
  };

  return (
    <TreeSelect
      showSearch
      style={{ width: '100%' }}
      value={value}
      suffixIcon={
        showMainDepartmentSet ? (
          <Tooltip title={t('Click to set main department')}>
            <Dropdown
              trigger={['click']}
              menu={{
                items: dropdownItems,
                selectable: true,
                defaultSelectedKeys: [String(mainIdRef.current)],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  // setMainDepartmentId(key);
                  mainIdRef.current = key;
                },
              }}
            >
              <SettingOutlined
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ cursor: 'pointer', color: '#1677ff' }}
              />
            </Dropdown>
          </Tooltip>
        ) : null
      }
      multiple
      onChange={onChange}
      labelInValue
      fieldNames={{ value: 'id' }}
      treeData={treeData}
      loadData={handleLoadData}
    />
  );
}, mapReadPretty(AssociationField.ReadPretty));

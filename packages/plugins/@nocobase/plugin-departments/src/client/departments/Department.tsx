/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { createContext, useContext, useState } from 'react';
import { Row, Button, Divider, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useDepartmentTranslation } from '../locale';
import { NewDepartment } from './NewDepartment';
import { DepartmentTree } from './DepartmentTree';
import { ResourcesContext } from '../ResourcesProvider';
import { AggregateSearch } from './AggregateSearch';
import { useDepartmentManager } from '../hooks';
import {
  ActionContextProvider,
  RecordProvider,
  SchemaComponent,
  SchemaComponentOptions,
  useAPIClient,
  useActionContext,
  useRecord,
  useResourceActionContext,
} from '@nocobase/client';
import { useForm, useField } from '@formily/react';

export const DepartmentTreeContext = createContext({} as ReturnType<typeof useDepartmentManager>);

export const useCreateDepartment = () => {
  const form = useForm();
  const field = useField();
  const ctx = useActionContext();
  const { refreshAsync } = useResourceActionContext();
  const api = useAPIClient();
  const { expandedKeys, setLoadedKeys, setExpandedKeys } = useContext(DepartmentTreeContext);
  return {
    async run() {
      try {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        await api.resource('departments').create({ values: form.values });
        ctx.setVisible(false);
        await form.reset();
        field.data.loading = false;
        const expanded = [...expandedKeys];
        setLoadedKeys([]);
        setExpandedKeys([]);
        await refreshAsync();
        setExpandedKeys(expanded);
      } catch (error) {
        if (field.data) {
          field.data.loading = false;
        }
      }
    },
  };
};

export const useUpdateDepartment = () => {
  const field = useField();
  const form = useForm();
  const ctx = useActionContext();
  const { refreshAsync } = useResourceActionContext();
  const api = useAPIClient();
  const { id: filterByTk } = useRecord() as any;
  const { expandedKeys, setLoadedKeys, setExpandedKeys } = useContext(DepartmentTreeContext);
  const { department, setDepartment } = useContext(ResourcesContext);
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await api.resource('departments').update({ filterByTk, values: form.values });
        setDepartment({ department, ...form.values });
        ctx.setVisible(false);
        await form.reset();
        const expanded = [...expandedKeys];
        setLoadedKeys([]);
        setExpandedKeys([]);
        await refreshAsync();
        setExpandedKeys(expanded);
      } catch (e) {
        console.log(e);
      } finally {
        field.data.loading = false;
      }
    },
  };
};

export const Department: React.FC = () => {
  const { t } = useDepartmentTranslation();
  const [visible, setVisible] = useState(false);
  const [drawer, setDrawer] = useState({} as any);
  const { department, setDepartment } = useContext(ResourcesContext);
  const { token } = theme.useToken();
  const departmentManager = useDepartmentManager({
    label: ({ node }) => <DepartmentTree.Item node={node} setVisible={setVisible} setDrawer={setDrawer} />,
  });

  return (
    <SchemaComponentOptions scope={{ useCreateDepartment, useUpdateDepartment }}>
      <DepartmentTreeContext.Provider value={departmentManager}>
        <Row>
          <AggregateSearch />
          <Button
            type="text"
            icon={<UserOutlined />}
            style={{
              textAlign: 'left',
              marginBottom: '5px',
              background: department ? '' : token.colorBgTextHover,
            }}
            onClick={() => {
              setDepartment(null);
            }}
            block
          >
            {t('All users')}
          </Button>
          <NewDepartment />
        </Row>
        <Divider style={{ margin: '12px 0' }} />
        <DepartmentTree />
        <ActionContextProvider value={{ visible, setVisible }}>
          <RecordProvider record={drawer.node || {}}>
            <SchemaComponent scope={{ t }} schema={drawer.schema || {}} />
          </RecordProvider>
        </ActionContextProvider>
      </DepartmentTreeContext.Provider>
    </SchemaComponentOptions>
  );
};

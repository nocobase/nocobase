import { message } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRecord, RecordContext_deprecated, SchemaComponentOptions } from '@nocobase/client';
import { CurrentRolesContext } from './';

export const SettingCenterPermissionProvider = (props) => {
  const { currentRecord } = useContext(PermissionContext);
  if (!currentRecord?.snippets?.includes('pm.*')) {
    return null;
  }
  return <div>{props.children}</div>;
};

export const PermissionContext = createContext<any>(null);
PermissionContext.displayName = 'PermissionContext';

export const PermissionProvider = (props) => {
  const api = useAPIClient();
  const record = useRecord();
  const { t } = useTranslation();
  const role = useContext(CurrentRolesContext);
  const { snippets } = role;
  snippets?.forEach((key) => {
    role[key] = true;
  });
  const [currentRecord, setCurrentRecord] = useState(role);
  useEffect(() => {
    setCurrentRecord(role);
  }, [role]);
  return (
    <PermissionContext.Provider
      value={{
        currentDataSource: record,
        currentRecord,
        update: async (field, form) => {
          await api.request({
            url: `dataSources/${record.key}/roles:update`,
            data: form.values,
            method: 'post',
            params: { filterByTk: form.values.roleName },
          });
          setCurrentRecord({ ...currentRecord, ...form.values });
          message.success(t('Saved successfully'));
        },
      }}
    >
      {props.children}
    </PermissionContext.Provider>
  );
};

export const RoleRecordProvider = (props) => {
  const role = useContext(CurrentRolesContext);
  const record = useRecord();
  return (
    <RecordContext_deprecated.Provider value={{ ...role }}>
      <SchemaComponentOptions scope={{ dataSourceKey: record.key }}>{props.children}</SchemaComponentOptions>
    </RecordContext_deprecated.Provider>
  );
};

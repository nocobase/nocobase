import { message } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRecord_deprecated } from '@nocobase/client';

export const SettingCenterPermissionProvider = (props) => {
  const { currentRecord } = useContext(PermissionContext);
  if (!currentRecord?.snippets?.includes('pm.*')) {
    return null;
  }
  return <div>{props.children}</div>;
};

export const PermissionContext = createContext<any>(null);

export const PermissionProvider = (props) => {
  const api = useAPIClient();
  const record = useRecord_deprecated();
  const { t } = useTranslation();
  const { snippets } = record;
  const { name: dataSourceKey } = useParams();
  snippets?.forEach((key) => {
    record[key] = true;
  });
  const [currentRecord, setCurrentRecord] = useState(record);

  return (
    <PermissionContext.Provider
      value={{
        currentRecord,
        update: async (field, form) => {
          await api.request({
            url: `dataSources/${dataSourceKey}/roles:update`,
            data: form.values,
            method: 'post',
            params: { filterByTk: record.name },
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

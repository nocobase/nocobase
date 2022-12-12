import React, { useContext, createContext, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRecord } from '../../record-provider';
import { useAPIClient } from '../../api-client';

export const SettingCenterPermissionProvider = (props) => {
  const {
    currentRecord: { allowConfigurePlugins },
  } = useContext(PermissionContext);

  if (!allowConfigurePlugins) {
    return null;
  }
  return <div>{props.children}</div>;
};

export const PermissionContext = createContext<any>(null);

export const PermissionProvider = (props) => {
  const api = useAPIClient();
  const record = useRecord();
  const { t } = useTranslation();
  const [currentRecord, setCurrentRecord] = useState(record);

  return (
    <PermissionContext.Provider
      value={{
        currentRecord,
        update: async (field, form) => {
          const { path, value } = field.getState() as any;
          if (['ui-editor', 'plugin-manager', 'settings-center.*'].includes(path)) {
            const resource = api.resource('roles.snippets', record.name);
            if (value) {
              await resource.add({
                values: [path],
              });
            } else {
              await resource.remove({
                values: [path],
              });
            }
          } else {
            const { data } = await api.resource('roles').update({
              filterByTk: record.name,
              values: form.values,
            });
          }
          // setCurrentRecord(data?.data?.[0]);
          message.success(t('Saved successfully'));
        },
      }}
    >
      {props.children}
    </PermissionContext.Provider>
  );
};

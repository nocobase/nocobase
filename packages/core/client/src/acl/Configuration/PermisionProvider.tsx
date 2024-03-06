import { message } from 'antd';
import React, { createContext, useContext, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useRecord } from '../../record-provider';

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
  const { snippets } = record;
  snippets?.forEach((key) => {
    record[key] = true;
  });
  const [currentRecord, setCurrentRecord] = useState(record);

  return (
    <PermissionContext.Provider
      value={{
        currentRecord,
        update: async (field, form) => {
          const { path, value } = field.getState() as any;
          if (['ui.*', 'pm', 'pm.*'].includes(path)) {
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
            setCurrentRecord({ ...currentRecord, ...form.values, [path]: value });
          } else {
            await api.resource('roles').update({
              filterByTk: record.name,
              values: form.values,
            });
            setCurrentRecord({ ...currentRecord, ...form.values });
          }

          message.success(t('Saved successfully'));
        },
      }}
    >
      {props.children}
    </PermissionContext.Provider>
  );
};

import { SettingsCenterProvider, CollectionManagerContext, CurrentAppInfoProvider } from '@nocobase/client';
import React, { FC, useContext } from 'react';
import { useDuplicatorTranslation } from './locale';
import { BackupAndRestoreList } from './Configuration';

export const DuplicatorProvider: FC = function (props) {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useDuplicatorTranslation();
  return (
    <CurrentAppInfoProvider>
      <SettingsCenterProvider
        settings={{
          backup: {
            title: t('Backup & Restore'),
            icon: 'CloudServerOutlined',
            tabs: {
              restore: {
                title: t('Backup & Restore'),
                component: BackupAndRestoreList,
              },
            },
          },
        }}
      >
        <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces } }}>
          {props.children}
        </CollectionManagerContext.Provider>
      </SettingsCenterProvider>
    </CurrentAppInfoProvider>
  );
};

DuplicatorProvider.displayName = 'DuplicatorProvider';

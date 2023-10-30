import { SettingsCenterProvider, CollectionManagerContext, CurrentAppInfoProvider } from '@nocobase/client';
import React, { FC, useContext } from 'react';
import { useDuplicatorTranslation } from './locale';
import { Configuration } from './Configuration';

export const DuplicatorProvider: FC = function (props) {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useDuplicatorTranslation();
  return (
    <CurrentAppInfoProvider>
      <SettingsCenterProvider
        settings={{
          duplicator: {
            title: t('Backup & Restore'),
            icon: 'ApiOutlined',
            tabs: {
              configuration: {
                title: t('Configuration'),
                component: Configuration,
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

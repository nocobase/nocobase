import React from 'react';
import { Tabs } from 'antd';
import { useACLTranslation } from '../locale';
import { RoleConfigure } from './RoleConfigure';
import { AvailableActionsProvider } from './AvailableActions';

export const Permissions: React.FC = () => {
  const { t } = useACLTranslation();
  return (
    <AvailableActionsProvider>
      <Tabs
        type="card"
        items={[
          {
            key: 'general',
            label: t('General permissions'),
            children: <RoleConfigure />,
          },
          {
            key: 'action',
            label: t('Action permissions'),
            children: null,
          },
          {
            key: 'menu',
            label: t('Menu permissions'),
            children: null,
          },
          {
            key: 'plugin',
            label: t('Plugin settings permissions'),
            children: null,
          },
        ]}
      />
    </AvailableActionsProvider>
  );
};

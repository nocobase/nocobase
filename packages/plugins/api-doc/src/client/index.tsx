import { Plugin, SettingsCenterProvider } from '@nocobase/client';

import React from 'react';
import { useTranslation } from '../locale';

const Documentation = () => {
  return <iframe src="/api/_documentation"></iframe>;
};

const APIDocumentationProvider = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        ['api-doc']: {
          title: t('Api Documentation'),
          icon: 'BookOutlined',
          tabs: {
            configuration: {
              title: t('Documentation'),
              component: Documentation,
            },
          },
        },
      }}
    ></SettingsCenterProvider>
  );
});
APIDocumentationProvider.displayName = 'APIDocumentationProvider';

export class APIDocumentationPlugin extends Plugin {
  async load() {
    this.app.use(APIDocumentationProvider);
  }
}

export default APIDocumentationPlugin;

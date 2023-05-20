import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { Card } from 'antd';

import providers from './schemas/providers';
import { useTranslationModule } from './useTranslationModule';
import locale from '../../../../core/client/src/locale';
import { localManageLang } from './locale';

export function LocalizationManagementProviders() {
  const { modules, lang } = useTranslationModule();
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={providers}
        scope={{
          localManageLang,
          moduleEnum: modules?.map((item) => ({ label: item, value: item })),
          langEnum: [{ label: locale[lang].label, value: locale[lang].label }],
        }}
      />
    </Card>
  );
}

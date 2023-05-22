import { LocaleLabels, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { Card } from 'antd';

import providers from './schemas/providers';
import { useTranslationModule } from './useTranslationModule';
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
          langEnum: [{ label: LocaleLabels[lang].label, value: LocaleLabels[lang].label }],
        }}
      />
    </Card>
  );
}

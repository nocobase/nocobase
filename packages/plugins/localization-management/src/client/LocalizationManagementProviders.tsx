import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { Card } from 'antd';

import providers from './schemas/providers';
import { useTranslationModule } from './useTranslationModule';

export function LocalizationManagementProviders() {
  const modules = useTranslationModule();
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={providers}
        scope={{
          moduleEnum: modules?.map((item) => ({ label: item, value: item })),
        }}
      />
    </Card>
  );
}

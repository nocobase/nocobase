import { PageHeader as AntdPageHeader } from '@ant-design/pro-layout';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionExtendsProvider } from '../collection-manager';
import { SchemaComponent } from '../schema-component';
import { uiSchemaTemplatesCollection } from './collections/uiSchemaTemplates';
import { uiSchemaTemplatesSchema } from './schemas/uiSchemaTemplates';

export const BlockTemplatePage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <AntdPageHeader style={{ backgroundColor: 'white' }} ghost={false} title={t('Block templates')} />
      <div style={{ margin: 'var(--nb-spacing)' }}>
        <CollectionExtendsProvider collections={[uiSchemaTemplatesCollection]}>
          <SchemaComponent schema={uiSchemaTemplatesSchema} />
        </CollectionExtendsProvider>
      </div>
    </div>
  );
};

export const BlockTemplatesPane = () => {
  return (
    <CollectionExtendsProvider collections={[uiSchemaTemplatesCollection]}>
      <SchemaComponent schema={uiSchemaTemplatesSchema} />
    </CollectionExtendsProvider>
  );
};

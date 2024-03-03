import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection_deprecated } from '../../collection-manager';
import { SchemaToolbar } from '../../schema-settings/GeneralSchemaDesigner';
import { useSchemaTemplate } from '../../schema-templates';

export const BlockSchemaToolbar = (props) => {
  const { t } = useTranslation();
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
    ? `${template?.name} ${t('(Fields only)')}`
    : template?.name;
  const toolbarTitle = useMemo(() => {
    return [title || name, templateName].filter(Boolean);
  }, [name, templateName, title]);

  return <SchemaToolbar title={toolbarTitle} {...props} />;
};

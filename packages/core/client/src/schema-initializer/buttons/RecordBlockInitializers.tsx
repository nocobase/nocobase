import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection } from '../..';
import { gridRowColWrap } from '../utils';

const useRelationFields = () => {
  const { fields } = useCollection();
  return fields
    .filter((field) => ['linkTo', 'subTable'].includes(field.interface))
    .map((field) => {
      return {
        key: field.name,
        type: 'item',
        field,
        title: field?.uiSchema?.title || field.name,
        component: 'RecordAssociationBlockInitializer',
      };
    }) as any;
};

export const RecordBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: '{{t("Current record blocks")}}',
          children: [
            {
              key: 'details',
              type: 'item',
              title: '{{t("Details")}}',
              component: 'RecordReadPrettyFormBlockInitializer',
            },
            {
              key: 'form',
              type: 'item',
              title: '{{t("Form")}}',
              component: 'RecordFormBlockInitializer',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: '{{t("Relationship blocks")}}',
          children: useRelationFields(),
        },
        {
          type: 'itemGroup',
          title: '{{t("Other blocks")}}',
          children: [
            {
              key: 'markdown',
              type: 'item',
              title: '{{t("Markdown")}}',
              component: 'MarkdownBlockInitializer',
            },
            {
              key: 'auditLogs',
              type: 'item',
              title: '{{t("Audit logs")}}',
              component: 'AuditLogsBlockInitializer',
            },
          ],
        },
      ]}
    />
  );
};

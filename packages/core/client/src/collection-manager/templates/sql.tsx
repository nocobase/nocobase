import { Field } from '@formily/core';
import { SQLInput, PreviewTable, FieldsConfigure, SQLRequestProvider } from './components/sql-collection';
import { getConfigurableProperties } from './properties';
import { i18n } from '../../i18n';
import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';

export class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  title = '{{t("SQL collection")}}';
  order = 4;
  color = 'yellow';
  default = {
    fields: [],
  };
  configurableProperties = {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    config: {
      type: 'void',
      'x-decorator': SQLRequestProvider,
      properties: {
        sql: {
          type: 'string',
          title: '{{t("SQL")}}',
          'x-decorator': 'FormItem',
          'x-component': SQLInput,
          required: true,
          'x-validator': (value: string, rules, { form }) => {
            const field = form.query('sql').take() as Field;
            if (!field.componentProps.disabled) {
              return i18n.t('Please confirm the SQL statement first');
            }
            return '';
          },
        },
        sources: {
          type: 'array',
          title: '{{t("Source collections")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            multiple: true,
          },
          'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
        },
        fields: {
          type: 'array',
          title: '{{t("Fields")}}',
          'x-decorator': 'FormItem',
          'x-component': FieldsConfigure,
          required: true,
        },
        table: {
          type: 'void',
          title: '{{t("Preview")}}',
          'x-decorator': 'FormItem',
          'x-component': PreviewTable,
        },
      },
    },
    ...getConfigurableProperties('category'),
  };
}

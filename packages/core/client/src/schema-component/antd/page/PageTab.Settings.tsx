import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { ISchema } from '@formily/json-schema';
import { useDesignable } from '../../hooks';
import { useSchemaToolbar } from '../../../application/schema-toolbar';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';

/**
 * @deprecated
 */
export const pageTabSettings = new SchemaSettings({
  name: 'PageTabSettings',
  items: [
    {
      name: 'edit',
      type: 'modal',
      useComponentProps() {
        const { t } = useTranslation();
        const { schema } = useSchemaToolbar<{ schema: ISchema }>();
        const { dn } = useDesignable();
        return {
          title: t('Edit'),
          schema: {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema,
          initialValues: { title: schema.title, icon: schema['x-icon'] },
          onSubmit: ({ title, icon }) => {
            schema.title = title;
            schema['x-icon'] = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: schema['x-uid'],
                title,
                'x-icon': icon,
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'item',
      useComponentProps() {
        const { modal } = App.useApp();
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const { schema } = useSchemaToolbar();
        return {
          title: t('Delete'),
          eventKey: 'remove',
          onClick() {
            modal.confirm({
              title: t('Delete block'),
              content: t('Are you sure you want to delete it?'),
              ...confirm,
              onOk() {
                dn.remove(schema);
              },
            });
          },
          children: t('Delete'),
        };
      },
    },
  ],
});

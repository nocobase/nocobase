import { useTranslation } from 'react-i18next';
import { SchemaSetting } from '../../../application';
import { ISchema } from '@formily/json-schema';
import { useDesignable } from '../../hooks';
import { useSchemaSettings } from '../../../schema-settings';
import { App } from 'antd';

export const pageTabSettings = new SchemaSetting({
  name: 'PageTabSettings',
  items: [
    {
      name: 'edit',
      type: 'modal',
      useComponentProps() {
        const { t } = useTranslation();
        const { designer } = useSchemaSettings<{ schema: ISchema }>();
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
          initialValues: { title: designer.schema.title, icon: designer.schema['x-icon'] },
          onSubmit: ({ title, icon }) => {
            designer.schema.title = title;
            designer.schema['x-icon'] = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: designer.schema['x-uid'],
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
        const { designer } = useSchemaSettings();
        return {
          title: 'Delete',
          eventKey: 'remove',
          onClick() {
            modal.confirm({
              title: t('Delete block'),
              content: t('Are you sure you want to delete it?'),
              ...confirm,
              onOk() {
                dn.remove(designer.schema);
              },
            });
          },
          children: t('Delete'),
        };
      },
    },
  ],
});

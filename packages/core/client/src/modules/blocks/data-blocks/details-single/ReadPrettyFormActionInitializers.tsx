import { useCollection_deprecated } from '../../../..';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';

const useVisibleCollection = () => {
  const collection = useCollection_deprecated();
  return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
};
// 表单的操作配置
export const readPrettyFormActionInitializers = new SchemaInitializer({
  name: 'ReadPrettyFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: '{{t("Enable actions")}}',
      children: [
        {
          title: '{{t("Edit")}}',
          name: 'edit',
          Component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
          useVisible: useVisibleCollection,
        },
        {
          title: '{{t("Delete")}}',
          name: 'delete',
          Component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible: useVisibleCollection,
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      name: 'customize',
      title: '{{t("Customize")}}',
      children: [
        {
          name: 'popup',
          title: '{{t("Popup")}}',
          Component: 'PopupActionInitializer',
          useComponentProps() {
            return {
              'x-component': 'Action',
            };
          },
        },
        {
          name: 'updateRecord',
          title: '{{t("Update record")}}',
          Component: 'UpdateRecordActionInitializer',
          useComponentProps() {
            return {
              'x-component': 'Action',
            };
          },
          visible: useVisibleCollection,
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
          useVisible: useVisibleCollection,
        },
      ],
    },
  ],
});

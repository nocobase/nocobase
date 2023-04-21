import { css } from '@emotion/css';

const listItemActionCss = css`
  margin-top: var(--nb-spacing);
  padding-top: var(--nb-spacing);
  border-top: 1px solid #e8e8e8;
`;
export const useListItemActionProps = () => {
  return {
    className: listItemActionCss,
  };
};

// 表单的操作配置
export const DetailsListActionInitializers = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Edit")}}',
          component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
        },
      ],
    },
  ],
};

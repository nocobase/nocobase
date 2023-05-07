import { useForm, useFieldSchema } from '@formily/react';
import { Modal as AntdModal } from 'antd';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContext } from './context';
import { useIsEmptyRecord } from '../../../block-provider/FormBlockProvider';

export const useA = () => {
  return {
    async run() {},
  };
};

export const useActionContext = () => {
  const ctx = useContext(ActionContext);
  const { t } = useTranslation();

  return {
    ...ctx,
    setVisible(visible: boolean, confirm = false) {
      if (ctx?.openMode !== 'page') {
        if (!visible) {
          if (confirm && ctx.formValueChanged) {
            AntdModal.confirm({
              title: t('Unsaved changes'),
              content: t("Are you sure you don't want to save?"),
              async onOk() {
                ctx.setFormValueChanged(false);
                ctx.setVisible?.(false);
              },
            });
          } else {
            ctx?.setVisible?.(false);
          }
        } else {
          ctx?.setVisible?.(visible);
        }
      }
    },
  };
};

export const useCloseAction = () => {
  const { setVisible } = useContext(ActionContext);
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

export const useLinkageAction = () => {
  const fieldSchema = useFieldSchema();
  const isRecordAction = useIsEmptyRecord();
  const isAction = ['Action.Link', 'Action'].includes(fieldSchema['x-component']);
  return isAction && isRecordAction;
};

export const useCustomRequestSchema = () => {
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '{{t("Request name")}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      method: {
        type: 'string',
        title: '{{t("HTTP method")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        default: 'POST',
        enum: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      url: {
        type: 'string',
        title: '{{t("URL")}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      headers: {
        type: 'array',
        title: '{{t("Request headers")}}',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                align: 'bottom',
              },
              properties: {
                key: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields")}}',
                    style: { width: 270 },
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields values")}}',
                    style: { width: 270 },
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        description: `{{t('"Content-Type" only support "application/json", and no need to specify')}}`,
        properties: {
          add: {
            type: 'void',
            title: '{{t("Add request header")}}',
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      params: {
        type: 'array',
        title: '{{t("Request query parameters")}}',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                key: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields")}}',
                    style: { width: 270 },
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields values")}}',
                    style: { width: 270 },
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: '{{t("Add parameter")}}',
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      data: {
        type: 'string',
        title: '{{t("Request body")}}',
        'x-decorator': 'FormItem',
        'x-component': 'JSONInput',
        'x-component-props': {
          autoSize: {
            minRows: 6,
          },
          placeholder: `{{t("Input request data")}}`,
        },
        description: `{{t("Only support standard JSON data")}}`,
      },
    },
  };
};

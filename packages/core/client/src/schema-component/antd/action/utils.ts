import { last } from 'lodash';
import { conditionAnalyse } from '../../common/utils/uitls';
import { ActionType } from '../../../schema-settings/LinkageRules/type';

export const linkageAction = (operator, field, condition, values) => {
  const disableResult = field?.linkageProperty?.disabled || [false];
  const displayResult = field?.linkageProperty?.display || ['visible'];
  switch (operator) {
    case ActionType.Visible:
      if (conditionAnalyse(condition, values)) {
        displayResult.push(operator);
        field.data = field.data || {};
        field.data.hidden = false;
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        display: displayResult,
      };
      field.display = last(displayResult);
      break;
    case ActionType.Hidden:
      if (conditionAnalyse(condition, values)) {
        field.data = field.data || {};
        field.data.hidden = true;
      } else {
        field.data = field.data || {};
        field.data.hidden = false;
      }
      break;
    case ActionType.Disabled:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        disabled: disableResult,
      };
      field.disabled = last(disableResult);
      break;
    case ActionType.Active:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(false);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        disabled: disableResult,
      };
      field.disabled = last(disableResult);
      break;
    default:
      return null;
  }
};

const userOptions = {
  label: "{{t('Users')}}",
  value: '$user',
  children: [
    {
      label: 'ID',
      value: 'id',
      key: 'id',
    },
    {
      label: "{{t('Nickname')}}",
      value: 'nickname',
      key: 'nickname',
    },
    {
      label: "{{t('Email')}}",
      value: 'email',
      key: 'email',
    },
    {
      label: "{{t('Phone')}}",
      value: 'phone',
      key: 'phone',
    },
    {
      label: "{{t('Roles')}}",
      value: 'roles',
      key: 'roles',
      children: [
        {
          label: "{{t('Role UID')}}",
          value: 'uid',
        },
        {
          label: "{{t('Role name')}}",
          value: 'title',
        },
      ],
    },
  ],
};
export const getCustomRequestSchema = (scopeOptions) => {
  const NameSpace = 'custom-request';
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: `{{t("Request name", { ns:"${NameSpace}"})}}`,
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      method: {
        type: 'string',
        title: `{{t("HTTP method", { ns:"${NameSpace}"})}}`,
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
        title: `{{t("URL", { ns:"${NameSpace}"})}}`,
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      requestType: {
        type: 'string',
        title: `{{t("request type", { ns:"${NameSpace}"})}}`,
        default: 'internal',
        enum: [
          { label: `{{t("internal request", { ns:"${NameSpace}"})}}`, value: 'internal' },
          { label: `{{t("external request", { ns:"${NameSpace}"})}}`, value: 'external' },
        ],
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        description: `{{t('URL description', { ns:"${NameSpace}"})}}`,
      },
      headers: {
        type: 'array',
        title: `{{t("Headers", { ns:"${NameSpace}"})}}`,
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
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: [userOptions, ...scopeOptions],
                    useTypedConstant: true,
                    placeholder: '{{t("Fields values")}}',
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
        description: `{{t('"Content-Type" only support "application/json", and no need to specify', { ns:"${NameSpace}"})}}`,
        properties: {
          add: {
            type: 'void',
            title: `{{t("Add request header", { ns:"${NameSpace}"})}}`,
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      params: {
        type: 'array',
        title: `{{t("Request query parameters", { ns:"${NameSpace}"})}}`,
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
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: [userOptions, ...scopeOptions],
                    useTypedConstant: true,
                    placeholder: '{{t("Fields values")}}',
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
            title: `{{t("Add parameter", { ns:"${NameSpace}"})}}`,
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      data: {
        type: 'string',
        title: `{{t("Request body", { ns:"${NameSpace}"})}}`,
        'x-decorator': 'FormItem',
        'x-component': 'Variable.JSON',
        'x-component-props': {
          scope: [userOptions, ...scopeOptions],
          autoSize: {
            minRows: 6,
          },
          placeholder: `{{t("Input request data", { ns:"${NameSpace}"})}}`,
        },
        description: `{{t("Only support standard JSON data", { ns:"${NameSpace}"})}}`,
      },
      timeout: {
        type: 'number',
        title: `{{t("Timeout config" ,{ ns:"${NameSpace}"})}}`,
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'InputNumber',
        'x-component-props': {
          addonAfter: `{{t("ms", { ns:"${NameSpace}"})}}`,
          min: 1,
          step: 1000,
          defaultValue: 5000,
        },
      },
    },
  };
};

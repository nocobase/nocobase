/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { tval } from '@nocobase/utils/client';
import { useGlobalVariable } from '../../../application/hooks/useGlobalVariable';
import { BlocksSelector } from '../../../schema-component/antd/action/Action.Designer';
import { useAfterSuccessOptions } from '../../../schema-component/antd/action/hooks/useGetAfterSuccessVariablesOptions';
import { refreshOnCompleteAction } from '../../actions/refreshOnCompleteAction';
import { secondaryConfirmationAction } from '../../actions/secondaryConfirmationAction';
import { RecordActionModel } from '../base/ActionModel';

export class CustomRequestRecordActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: tval('Custom request'),
  };
}

CustomRequestRecordActionModel.define({
  title: tval('Custom request'),
  hide: true,
});

const fieldNames = {
  value: 'value',
  label: 'label',
};
const useVariableProps = () => {
  const environmentVariables = useGlobalVariable('$env');
  const scope = useAfterSuccessOptions();
  return {
    scope: [environmentVariables, ...scope].filter(Boolean),
    fieldNames,
  };
};

CustomRequestRecordActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmation: secondaryConfirmationAction,
    request: {
      title: tval('Request settings'),
      uiSchema: {
        method: {
          type: 'string',
          required: true,
          title: tval('HTTP method'),
          'x-decorator-props': {
            tooltip: tval(
              'When the HTTP method is Post, Put or Patch, and this custom request inside the form, the request body will be automatically filled in with the form data',
            ),
          },
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            showSearch: false,
            allowClear: false,
            className: 'auto-width',
          },
          enum: [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'DELETE', value: 'DELETE' },
          ],
          default: 'POST',
        },
        url: {
          type: 'string',
          required: true,
          title: tval('URL'),
          'x-decorator': 'FormItem',
          'x-component': 'Variable.TextArea',
          'x-use-component-props': useVariableProps,
          'x-component-props': {
            placeholder: tval('https://www.nocobase.com'),
          },
        },
        headers: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          title: tval('Headers'),
          description: tval('"Content-Type" only support "application/json", and no need to specify'),
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                properties: {
                  name: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: tval('Name'),
                    },
                  },
                  value: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Variable.TextArea',
                    'x-use-component-props': useVariableProps,
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
              title: tval('Add request header'),
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
        params: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          title: tval('Parameters'),
          items: {
            type: 'object',
            properties: {
              space: {
                type: 'void',
                'x-component': 'Space',
                properties: {
                  name: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: tval('Name'),
                    },
                  },
                  value: {
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'Variable.TextArea',
                    'x-use-component-props': useVariableProps,
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
              title: tval('Add parameter'),
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
        data: {
          type: 'string',
          title: tval('Body'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {},
          'x-component': 'Variable.JSON',
          'x-component-props': {
            scope: '{{useCustomRequestVariableOptions}}',
            fieldNames: {
              value: 'name',
              label: tval('title'),
            },
            changeOnSelect: true,
            autoSize: {
              minRows: 10,
            },
            placeholder: tval('Input request data'),
          },
          description: tval('Only support standard JSON data'),
        },
        timeout: {
          type: 'number',
          title: tval('Timeout config'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {},
          'x-component': 'InputNumber',
          'x-component-props': {
            addonAfter: 'ms',
            min: 1,
            step: 1000,
            defaultValue: 5000,
          },
        },
        responseType: {
          type: 'string',
          title: tval('Response type'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {},
          'x-component': 'Select',
          default: 'json',
          enum: [
            { value: 'json', label: 'JSON' },
            { value: 'stream', label: 'Stream' },
          ],
        },
      },
      async handler(ctx, params) {
        ctx.modal({
          title: tval('TODO: Custom request action handler'),
        });
      },
    },
    afterSuccess: {
      title: tval('After successful submission'),
      uiSchema: {
        successMessage: {
          title: tval('Popup message'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-component-props': {},
        },
        manualClose: {
          title: tval('Message popup close method'),
          enum: [
            { label: tval('Automatic close'), value: false },
            { label: tval('Manually close'), value: true },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {},
        },
        redirecting: {
          title: tval('Then'),
          'x-hidden': true,
          enum: [
            { label: tval('Stay on current page'), value: false },
            { label: tval('Redirect to'), value: true },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {},
          'x-reactions': {
            target: 'redirectTo',
            fulfill: {
              state: {
                visible: '{{!!$self.value}}',
              },
            },
          },
        },
        actionAfterSuccess: {
          title: tval('Action after successful submission'),
          enum: [
            { label: tval('Stay on the current popup or page'), value: 'stay' },
            { label: tval('Return to the previous popup or page'), value: 'previous' },
            { label: tval('Redirect to'), value: 'redirect' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {},
          'x-reactions': {
            target: 'redirectTo',
            fulfill: {
              state: {
                visible: "{{$self.value==='redirect'}}",
              },
            },
          },
        },
        redirectTo: {
          title: tval('Link'),
          'x-decorator': 'FormItem',
          'x-component': 'Variable.TextArea',
          // eslint-disable-next-line react-hooks/rules-of-hooks
          'x-use-component-props': () => useVariableProps(),
        },
        blocksToRefresh: {
          type: 'array',
          title: tval('Refresh data blocks'),
          'x-decorator': 'FormItem',
          'x-use-decorator-props': () => {
            return {
              tooltip: tval('After successful submission, the selected data blocks will be automatically refreshed.'),
            };
          },
          'x-component': BlocksSelector,
          // 'x-hidden': isInBlockTemplateConfigPage, // 模板配置页面暂不支持该配置
        },
      },
      handler(ctx, params) {},
    },
    refresh: refreshOnCompleteAction,
  },
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { useGlobalVariable } from '../../application/hooks/useGlobalVariable';
import { BlocksSelector } from '../../schema-component/antd/action/Action.Designer';
import { useAfterSuccessOptions } from '../../schema-component/antd/action/hooks/useGetAfterSuccessVariablesOptions';

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

export const afterSuccessAction = {
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
};

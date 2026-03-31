/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCompile, RemoteSelect } from '@nocobase/client';
import {
  Trigger,
  useWorkflowAnyExecuted,
  getCollectionFieldOptions,
  useGetDataSourceCollectionManager,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE, useLang } from '../locale';

const HTTP_METHODS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
];

function useVariables(config, options) {
  const compile = useCompile();
  const mainCollectionManager = useGetDataSourceCollectionManager();

  const langUrl = useLang('URL path');
  const langQuery = useLang('Query parameters');
  const langMethod = useLang('HTTP method');
  const langHeaders = useLang('Request headers');
  const langBody = useLang('Request body');
  const langParams = useLang('Path params');
  const langUser = useLang('Current user');
  const langRole = useLang('Current role');

  return [
    {
      key: 'url',
      value: 'url',
      label: langUrl,
    },
    {
      key: 'query',
      value: 'query',
      label: langQuery,
    },
    {
      key: 'method',
      value: 'method',
      label: langMethod,
    },
    {
      key: 'headers',
      value: 'headers',
      label: langHeaders,
    },
    {
      key: 'body',
      value: 'body',
      label: langBody,
    },
    {
      key: 'params',
      value: 'params',
      label: langParams,
    },
    ...getCollectionFieldOptions({
      appends: ['user'],
      ...options,
      fields: [
        {
          collectionName: 'users',
          name: 'user',
          type: 'hasOne',
          target: 'users',
          uiSchema: {
            title: langUser,
          },
        },
        {
          name: 'roleName',
          uiSchema: {
            title: langRole,
          },
        },
      ],
      compile,
      collectionManager: mainCollectionManager,
    }),
  ];
}

export default class extends Trigger {
  title = `{{t("URL event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Triggered when a user accesses a URL matching the configured pattern. In sync mode the workflow can intercept and redirect; in async mode it fires without blocking.", { ns: "${NAMESPACE}" })}}`;

  fieldset = {
    url: {
      type: 'string',
      required: true,
      title: `{{t("URL pattern", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Glob examples: /admin/*, /api/users/**. Regex examples: ^/admin/(settings|users)", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: '/admin/**',
      },
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
    },
    matchMode: {
      type: 'string',
      title: `{{t("Match mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        optionType: 'button',
      },
      enum: [
        { label: 'Glob', value: 'glob' },
        { label: 'Regex', value: 'regex' },
      ],
      default: 'glob',
    },
    methods: {
      type: 'array',
      title: `{{t("HTTP methods", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Leave empty to match all methods", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
      'x-component-props': {
        options: HTTP_METHODS,
      },
      default: [],
    },
  };

  triggerFieldset = {
    url: {
      type: 'string',
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
  };

  components = {};

  scope = {
    useWorkflowAnyExecuted,
  };

  useVariables = useVariables;

  validate(config) {
    return !!config?.url;
  }
}

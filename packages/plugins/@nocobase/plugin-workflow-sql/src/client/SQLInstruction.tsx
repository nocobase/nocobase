/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY, css } from '@nocobase/client';
import { ArrayItems } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { Space, Input, Alert, Button } from 'antd';
import { parse } from '@nocobase/utils/client';
import { set } from 'lodash';

import {
  Instruction,
  WorkflowVariableInput,
  WorkflowVariableRawTextArea,
  defaultFieldNames,
} from '@nocobase/plugin-workflow/client';

import React from 'react';
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import { NAMESPACE } from '../locale';

function SQLTextArea(props) {
  const { values } = useForm();

  return values.unsafeInjection ? <WorkflowVariableRawTextArea {...props} /> : <Input.TextArea {...props} />;
}

function UnsafeInjectionWarning() {
  const { t } = useTranslation(NAMESPACE);
  const form = useForm();
  const { values } = form;

  if (!values.unsafeInjection || form.disabled) {
    return null;
  }

  const onMigrate = () => {
    const sql = values.sql || '';
    const template = parse(sql);
    const parameters = template.parameters || [];

    // Deduplicate and assign new names
    const uniqueKeys: string[] = [
      ...new Set(
        parameters.map((p: { key: string }) => p.key).filter((key) => key && typeof key === 'string') as string[],
      ),
    ];
    const context = {};
    uniqueKeys.forEach((key, index) => {
      set(context, key, `:var${index}`);
    });

    // Build variables config
    const variables = uniqueKeys.map((key, index) => ({
      name: `var${index}`,
      value: `{{${key}}}`,
    }));

    // Replace {{...}} in SQL with :name placeholders
    const newSql = template(context);

    form.setValues({
      sql: newSql,
      variables,
      unsafeInjection: false,
    });
  };

  return (
    <Alert
      type="error"
      showIcon
      message={t('Current node is using unsafe injection mode (legacy), which has SQL injection risks.')}
      action={
        <Button size="small" type="primary" onClick={onMigrate}>
          {t('Migrate to safe mode')}
        </Button>
      }
      style={{ marginBottom: 16 }}
    />
  );
}

export default class extends Instruction {
  title = `{{t("SQL action", { ns: "${NAMESPACE}" })}}`;
  type = 'sql';
  group = 'collection';
  description = `{{t("Execute a SQL statement in database.", { ns: "${NAMESPACE}" })}}`;
  icon = (<ConsoleSqlOutlined style={{}} />);
  fieldset = {
    dataSource: {
      type: 'string',
      required: true,
      title: `{{t("Data source")}}`,
      description: `{{t("Select a data source to execute SQL.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceSelect',
      'x-component-props': {
        className: 'auto-width',
        filter(item) {
          return item.options.isDBInstance || item.key === DEFAULT_DATA_SOURCE_KEY;
        },
      },
      default: 'main',
    },
    unsafeInjection: {
      type: 'void',
      'x-component': 'UnsafeInjectionWarning',
    },
    sql: {
      type: 'string',
      required: true,
      title: 'SQL',
      description: '{{sqlDescription()}}',
      'x-decorator': 'FormItem',
      'x-component': 'SQLTextArea',
      'x-component-props': {
        rows: 20,
        className: css`
          font-size: 80%;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        `,
      },
    },
    variables: {
      type: 'array',
      title: `{{t("Parameters", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("SQL parameters. Use :name as placeholders in SQL and provide values here.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      'x-reactions': [
        {
          dependencies: ['unsafeInjection'],
          fulfill: {
            state: {
              visible: '{{!$deps[0]}}',
            },
          },
        },
      ],
      items: {
        type: 'object',
        properties: {
          space1: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name", { ns: "${NAMESPACE}" })}}`,
                },
                required: true,
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableInput',
                'x-component-props': {
                  rows: 1,
                  placeholder: `{{t("Value", { ns: "${NAMESPACE}" })}}`,
                },
                required: true,
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
          'x-component': 'ArrayItems.Addition',
          title: `{{t("Add parameter", { ns: "${NAMESPACE}" })}}`,
        },
      },
    },
    withMeta: {
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-content': `{{t("Include meta information of this query in result", { ns: "${NAMESPACE}" })}}`,
    },
  };
  scope = {
    sqlDescription() {
      return (
        <Trans ns={NAMESPACE}>
          {'SQL query result could be used through '}
          <a href="https://docs-cn.nocobase.com/handbook/workflow-json-query" target="_blank" rel="noreferrer">
            {'JSON query node'}
          </a>
          {'.'}
        </Trans>
      );
    },
  };
  components = {
    SQLTextArea,
    UnsafeInjectionWarning,
    WorkflowVariableInput,
    ArrayItems,
    Space,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
  testable = true;
}

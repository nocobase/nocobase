/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY, css } from '@nocobase/client';

import { Instruction, WorkflowVariableRawTextArea, defaultFieldNames } from '@nocobase/plugin-workflow/client';

import React from 'react';
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { Trans } from 'react-i18next';
import { NAMESPACE } from '../locale';

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
    sql: {
      type: 'string',
      required: true,
      title: 'SQL',
      description: '{{sqlDescription()}}',
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableRawTextArea',
      'x-component-props': {
        rows: 20,
        className: css`
          font-size: 80%;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        `,
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
          {' (Commercial plugin).'}
        </Trans>
      );
    },
  };
  components = {
    WorkflowVariableRawTextArea,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
  testable = true;
}

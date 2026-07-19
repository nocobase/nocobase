/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ConsoleSqlOutlined } from '@ant-design/icons';
import { Instruction, type LoaderOf } from '@nocobase/plugin-workflow/client-v2';
import { NAMESPACE, SQL_INSTRUCTION_TYPE } from './constants';

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

const defaultFieldNames = { label: 'label', value: 'value' } as const;

export default class SQLInstruction extends Instruction {
  title = t('SQL action');
  type = SQL_INSTRUCTION_TYPE;
  group = 'collection';
  description = t('Execute a SQL statement in database.');
  icon = (<ConsoleSqlOutlined />);
  testable = true;
  FieldsetLoader: LoaderOf = () => import('./components/SQLFieldset').then((m) => ({ default: m.SQLFieldset }));

  createDefaultConfig() {
    return {
      dataSource: 'main',
    };
  }

  useVariables({ key, title }: { key: string; title?: string }, { fieldNames = defaultFieldNames } = {}) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useCallback } from 'react';
import { Select, Radio } from 'antd';

import {
  Instruction,
  WorkflowVariableInput,
  defaultFieldNames,
  useAvailableUpstreams,
  useNodeContext,
} from '@nocobase/plugin-workflow/client';
import { Space, createStyles, useCollectionDataSource } from '@nocobase/client';

import { NAMESPACE, lang } from '../locale';

const useStyles = createStyles(({ css, token }) => {
  return {
    nodeIdClass: css`
      color: ${token.colorTextDescription};

      &:before {
        content: '#';
      }
    `,
  };
});

function VariableTargetSelect({ value, onChange }) {
  const declaring = value == null;
  const current = useNodeContext();
  const variables = useAvailableUpstreams(current, (node) => node.type === 'variable' && !node.config.target);
  const { styles } = useStyles();

  const onRadioChange = useCallback(
    ({ target }) => {
      if (target.value) {
        return onChange(null);
      }
      if (variables.length) {
        onChange(variables[0].key);
      }
    },
    [onChange, variables],
  );

  const filterOption = useCallback((input, option) => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 || `#${option.data.id}`.indexOf(input) >= 0;
  }, []);

  return (
    <fieldset>
      <Radio.Group value={declaring} onChange={onRadioChange}>
        <Space direction="vertical">
          <Radio value={true}>{lang('Declare a new variable')}</Radio>
          <Space>
            <Radio value={false} disabled={!variables.length}>
              {lang('Assign value to an existing variable')}
            </Radio>
            {!declaring && (
              <Select
                options={variables.map((data) => ({
                  label: data.title,
                  value: data.key,
                  data,
                }))}
                value={value}
                onChange={onChange}
                allowClear
                showSearch
                filterOption={filterOption}
              />
            )}
          </Space>
        </Space>
      </Radio.Group>
    </fieldset>
  );
}

export default class extends Instruction {
  title = `{{t("Variable", { ns: "${NAMESPACE}" })}}`;
  type = 'variable';
  group = 'control';
  description = `{{t("Assign value to a variable, for later use.", { ns: "${NAMESPACE}" })}}`;
  icon = (
    <span
      className="anticon"
      style={{
        display: 'inline-block',
        width: '1em',
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'New York, Times New Roman, Times, serif',
      }}
    >
      x
    </span>
  );
  fieldset = {
    target: {
      type: 'string',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'VariableTargetSelect',
    },
    value: {
      type: 'string',
      title: `{{t("Value", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        useTypedConstant: true,
        changeOnSelect: true,
      },
      default: '',
    },
  };
  scope = {
    useCollectionDataSource,
  };
  components = {
    WorkflowVariableInput,
    VariableTargetSelect,
  };
  useVariables({ key, title, config }, { types, fieldNames = defaultFieldNames }) {
    return config?.target
      ? null
      : {
          [fieldNames.value]: key,
          [fieldNames.label]: title,
        };
  }
}

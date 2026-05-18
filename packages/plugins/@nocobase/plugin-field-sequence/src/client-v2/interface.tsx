/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ArrayTable, FormButtonGroup, FormDrawer, FormItem, FormLayout, Input, Select, Submit } from '@formily/antd-v5';
import { onFieldValueChange } from '@formily/core';
import { createSchemaField, ISchema, useForm, useFormEffects } from '@formily/react';
import { CollectionFieldInterface } from '@nocobase/client-v2';
import { compileUiSchema, useFlowContext } from '@nocobase/flow-engine';
import { error } from '@nocobase/utils/client';
import { Button, InputNumber, Select as AntdSelect, theme } from 'antd';
import React from 'react';
import { Cron as ReactCron } from 'react-js-cron';
import { tExpr } from './locale';

const stringOperators = [
  { label: '{{t("contains")}}', value: '$includes', selected: true },
  { label: '{{t("does not contain")}}', value: '$notIncludes' },
  { label: '{{t("is")}}', value: '$eq' },
  { label: '{{t("is not")}}', value: '$ne' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

const defaultProps = {
  'uiSchema.title': {
    type: 'string',
    title: '{{t("Field display name")}}',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '{{t("Field name")}}',
    required: true,
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
};

const useCompileTitle = () => {
  const { t } = useFlowContext();
  return React.useCallback((source: any) => compileUiSchema({ t }, source), [t]);
};

function RuleTypeSelect(props) {
  const compile = useCompileTitle();
  const { setValuesIn } = useForm();
  const index = ArrayTable.useIndex();

  useFormEffects(() => {
    onFieldValueChange(`patterns.${index}.type`, (field) => {
      const type = RuleTypes[field.value];
      setValuesIn(`patterns.${index}.options`, type.defaults ? { ...type.defaults } : {});
    });
  });

  return (
    <AntdSelect popupMatchSelectWidth={false} {...props}>
      {Object.keys(RuleTypes).map((key) => (
        <AntdSelect.Option key={key} value={key}>
          {compile(RuleTypes[key].title)}
        </AntdSelect.Option>
      ))}
    </AntdSelect>
  );
}

function CronReadPretty({ value }) {
  const compile = useCompileTitle();
  const option = getCronOption(value);
  if (option?.value !== 5) {
    return <code>{compile(option?.label || CRON_OPTIONS[0].label)}</code>;
  }
  return <code>{value}</code>;
}

function CronCycleSelector({ value, onChange }) {
  const compile = useCompileTitle();
  const option = getCronOption(value);

  return (
    <fieldset>
      <AntdSelect value={option.value} onChange={(nextValue) => onChange(CRON_OPTIONS[nextValue].cron)}>
        {CRON_OPTIONS.map((item) => (
          <AntdSelect.Option key={item.value} value={item.value}>
            {compile(item.label)}
          </AntdSelect.Option>
        ))}
      </AntdSelect>
      {option.value === 5 ? (
        <ReactCron
          value={value || CRON_OPTIONS[5].cron}
          setValue={onChange}
          clearButton={false}
          locale={window['cronLocale']}
        />
      ) : null}
    </fieldset>
  );
}

function RuleOptions() {
  const compile = useCompileTitle();
  const { values } = useForm();
  const index = ArrayTable.useIndex();
  const { type, options } = values.patterns[index];
  const ruleType = RuleTypes[type];
  return (
    <div
      className={css`
        display: flex;
        gap: 1em;
        flex-wrap: wrap;
      `}
    >
      {Object.keys(options)
        .filter((key) => typeof options[key] !== 'undefined' && ruleType.optionRenders[key])
        .map((key) => {
          const Component = ruleType.optionRenders[key];
          const { title } = ruleType.fieldset[key];
          return Component ? (
            <dl
              key={key}
              className={css`
                margin: 0;
                padding: 0;
              `}
            >
              <dt>{compile(title)}</dt>
              <dd
                className={css`
                  margin-bottom: 0;
                `}
              >
                <Component key={key} value={options[key]} />
              </dd>
            </dl>
          ) : null;
        })}
    </div>
  );
}

const CRON_OPTIONS = [
  { label: tExpr('No reset'), value: 0, cron: null },
  { label: tExpr('Daily'), value: 1, cron: '0 0 * * *' },
  { label: tExpr('Every Monday'), value: 2, cron: '0 0 * * 1' },
  { label: tExpr('Monthly'), value: 3, cron: '0 0 1 * *' },
  { label: tExpr('Yearly'), value: 4, cron: '0 0 1 1 *' },
  { label: tExpr('Customize'), value: 5, cron: '* * * * *' },
];

function getCronOption(value) {
  if (typeof value === 'undefined' || value === null) {
    return CRON_OPTIONS[0];
  }
  return CRON_OPTIONS.find((item) => item.cron == value) || CRON_OPTIONS[5];
}

const RuleTypes = {
  string: {
    title: tExpr('Fixed text'),
    optionRenders: {
      value(options = { value: '' }) {
        return <code>{options.value}</code>;
      },
    },
    fieldset: {
      value: {
        type: 'string',
        title: tExpr('Text content'),
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  },
  randomChar: {
    title: tExpr('Random character'),
    optionRenders: {
      length: function Length({ value }) {
        return <code>{value}</code>;
      },
      charsets: function Charsets({ value }) {
        const compile = useCompileTitle();
        const charsetLabels = {
          number: compile(tExpr('Number')),
          lowercase: compile(tExpr('Lowercase letters')),
          uppercase: compile(tExpr('Uppercase letters')),
          symbol: compile(tExpr('Symbols')),
        };
        return <code>{value?.map((charset) => charsetLabels[charset]).join(', ') || charsetLabels.number}</code>;
      },
    },
    fieldset: {
      length: {
        type: 'number',
        title: tExpr('Length'),
        description: tExpr('Will generate random characters with specified length.'),
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 1,
          max: 32,
        },
        required: true,
        default: 6,
      },
      charsets: {
        type: 'array',
        title: tExpr('Character sets'),
        description: tExpr('Select character sets to generate random characters.'),
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          mode: 'multiple',
          allowClear: false,
        },
        enum: [
          { value: 'number', label: tExpr('Number') },
          { value: 'lowercase', label: tExpr('Lowercase letters') },
          { value: 'uppercase', label: tExpr('Uppercase letters') },
          { value: 'symbol', label: tExpr('Symbols') },
        ],
        required: true,
        default: ['number'],
        'x-validator': {
          minItems: 1,
          message: tExpr('At least one character set should be selected'),
        },
      },
    },
    defaults: {
      length: 6,
      charsets: ['number'],
    },
  },
  integer: {
    title: tExpr('Autoincrement'),
    optionRenders: {
      digits: function Digits({ value }) {
        return <code>{value}</code>;
      },
      start: function Start({ value }) {
        return <code>{value}</code>;
      },
      cycle: CronReadPretty,
    },
    fieldset: {
      digits: {
        type: 'number',
        title: tExpr('Digits'),
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 1,
          max: 10,
        },
        required: true,
        default: 1,
        'x-reactions': {
          target: 'start',
          fulfill: {
            schema: {
              'x-component-props.max': '{{ 10 ** $self.value - 1 }}',
            },
          },
        },
      },
      start: {
        type: 'number',
        title: tExpr('Start from'),
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 0,
        },
        required: true,
        default: 0,
      },
      cycle: {
        type: 'string',
        title: tExpr('Reset cycle'),
        'x-decorator': 'FormItem',
        'x-component': CronCycleSelector,
        default: null,
      },
    },
    defaults: {
      digits: 4,
      start: 1,
    },
  },
  date: {
    title: tExpr('Date'),
    optionRenders: {
      format(options = { value: 'YYYYMMDD' }) {
        return <code>{options.value}</code>;
      },
    },
    fieldset: {
      format: {
        type: 'string',
        title: tExpr('Date format'),
        description: tExpr('Supports all formats of the Day.js library, such as "YYYYMMDD", "YYYY-MM-DD", etc.'),
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        default: 'YYYYMMDD',
      },
    },
    defaults: {
      format: 'YYYYMMDD',
    },
  },
};

export function RuleConfigForm() {
  const { t } = useFlowContext();
  const compile = useCompileTitle();
  const { values, setValuesIn } = useForm();
  const index = ArrayTable.useIndex();
  const { type, options } = values.patterns[index];
  const ruleType = RuleTypes[type];
  const { token } = theme.useToken();
  return ruleType?.fieldset ? (
    <Button
      type="link"
      onClick={() => {
        FormDrawer({ title: compile(ruleType.title), zIndex: token.zIndexPopupBase + 1000 }, () => {
          return (
            <FormLayout layout="vertical">
              <SchemaField
                schema={{
                  type: 'object',
                  'x-component': 'fieldset',
                  properties: ruleType.fieldset,
                }}
              />
              <FormDrawer.Footer>
                <FormButtonGroup
                  className={css`
                    justify-content: flex-end;
                  `}
                >
                  <Submit
                    onSubmit={(values) => {
                      return values;
                    }}
                  >
                    {t('Submit')}
                  </Submit>
                </FormButtonGroup>
              </FormDrawer.Footer>
            </FormLayout>
          );
        })
          .open({
            initialValues: options,
          })
          .then((values) => {
            setValuesIn(`patterns.${index}`, { type, options: { ...values } });
          })
          .catch((err) => {
            error(err);
          });
      }}
    >
      {t('Configure')}
    </Button>
  ) : null;
}

const SchemaField = createSchemaField({
  components: {
    ArrayTable,
    FormItem,
    Input,
    InputNumber,
    Select,
    RuleTypeSelect,
    RuleOptions,
    RuleConfigForm,
    CronCycleSelector,
  },
});

export class SequenceFieldInterface extends CollectionFieldInterface {
  name = 'sequence';
  type = 'object';
  group = 'advanced';
  order = 3;
  title = tExpr('Sequence');
  description = tExpr(
    'Automatically generate codes based on configured rules, supporting combinations of dates, numbers, and text.',
  );
  sortable = true;
  default = {
    interface: 'sequence',
    type: 'sequence',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {},
    },
  };
  availableTypes = ['sequence'];
  hasDefaultValue = false;
  filterable = {
    operators: stringOperators,
  };
  titleUsable = true;
  properties: Record<string, ISchema> = {
    ...defaultProps,
    unique: {
      type: 'boolean',
      'x-content': '{{t("Unique")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createMainOnly || primaryKeyOnly }}',
      'x-reactions': [
        {
          dependencies: ['primaryKey'],
          when: '{{$deps[0]}}',
          fulfill: {
            state: {
              value: false,
            },
          },
        },
      ],
    },
    patterns: {
      type: 'array',
      title: tExpr('Sequence rules'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      items: {
        type: 'object',
        properties: {
          sort: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { width: 50, title: '', align: 'center' },
            properties: {
              sort: {
                type: 'void',
                'x-component': 'ArrayTable.SortHandle',
              },
            },
          },
          type: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: tExpr('Type') },
            properties: {
              type: {
                type: 'string',
                name: 'type',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': RuleTypeSelect,
              },
            },
          },
          options: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: tExpr('Rule content') },
            properties: {
              options: {
                type: 'object',
                name: 'options',
                'x-component': RuleOptions,
              },
            },
          },
          operations: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: tExpr('Operations'),
              dataIndex: 'operations',
              fixed: 'right',
              className: css`
                > *:not(:last-child) {
                  margin-right: 0.5em;
                }
                button {
                  padding: 0;
                }
              `,
            },
            properties: {
              config: {
                type: 'void',
                properties: {
                  options: {
                    type: 'object',
                    'x-component': RuleConfigForm,
                  },
                },
              },
              remove: {
                type: 'void',
                'x-component': 'ArrayTable.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayTable.Addition',
          'x-component-props': {
            defaultValue: { type: 'integer', options: { ...RuleTypes.integer.defaults } },
          },
          title: tExpr('Add rule'),
        },
      },
    },
    inputable: {
      type: 'boolean',
      title: tExpr('Inputable'),
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    match: {
      type: 'boolean',
      title: tExpr('Match rules'),
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-reactions': {
        dependencies: ['inputable'],
        fulfill: {
          state: {
            value: '{{$deps[0] && $self.value}}',
            visible: '{{$deps[0] === true}}',
          },
        },
      },
    },
  };
}

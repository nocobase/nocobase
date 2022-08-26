import React, { useContext } from 'react';
import { Button, Select } from 'antd';
import { SchemaOptionsContext, useForm } from '@formily/react';
import { ArrayTable, FormDrawer, FormLayout, Submit } from '@formily/antd';
import { useTranslation } from 'react-i18next';

import { IField } from './types';
import { defaultProps, operators, unique } from './properties';
import { Cron, SchemaComponent, SchemaComponentOptions, useCompile } from '../../schema-component';

const RuleTypes = {
  string: {
    title: '{{t("Fixed string")}}',
    render(options = { value: '' }) {
      return options.value;
    }
  },
  integer: {
    title: '{{t("Autoincrement")}}',
    render(options = {}) {
      return (
        <>
          {Object.keys(options).map(key => {
            const Component = this.optionRenders[key];
            return Component
              ? <Component key={key} value={options[key]} />
              : null;
          })}
        </>
      );
    },
    optionRenders: {
      digits({ value }) {
        const { t } = useTranslation();
        return (
          <span>
            {t('{{value}} Digits', { value })}
          </span>
        );
      },
      start({ value }) {
        const { t } = useTranslation();
        return (
          <span>
            {t('Starts from {{value}}', { value })}
          </span>
        );
      },
      cycle({ value }) {
        console.log('----------', value);
        return (
          <SchemaComponent
            schema={{
              type: 'string',
              name: 'cycle',
              'x-component': 'Cron',
              'x-read-pretty': true,
            }}
          />
        );
      }
    },
    fieldset: {
      digits: {
        type: 'number',
        title: '{{t("Digits")}}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          max: 10
        },
        required: true,
        default: 1
      },
      start: {
        type: 'number',
        title: '{{t("Start from")}}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 0
        },
        required: true,
        default: 0
      },
      cycle: {
        type: 'string',
        title: '{{t("Reset cycle")}}',
        'x-decorator': 'FormItem',
        ['x-component']({ value, onChange }) {
          const shortValues = [
            { label: '不重置', value: 0, cron: null },
            { label: '每天', value: 1, cron: '0 0 * * *' },
            { label: '每周一', value: 2, cron: '0 0 * * 1' },
            { label: '每月', value: 3, cron: '0 0 1 * *' },
            { label: '每年', value: 4, cron: '0 0 1 1 *' },
            { label: '自定义', value: 5, cron: '* * * * *' }
          ];
          const option = typeof value === 'undefined'
            ? shortValues[0]
            : shortValues.find(item => {
              return item.cron == value
            }) || shortValues[5]
          return (
            <fieldset>
              <Select value={option.value} onChange={(v) => onChange(shortValues[v].cron)}>
                {shortValues.map(item => (
                  <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
                ))}
              </Select>
              {option.value === 5
                ? (
                  <Cron
                    value={value}
                    setValue={onChange}
                    clearButton={false}
                  />
                )
                : null}
            </fieldset>
          );
        },
        default: null
      }
    }
  }
};

function useRowOptions() {
  const { options } = ArrayTable.useRecord();
  return options;
}

function RuleConfig({ value, onChange }) {
  const { type, options } = ArrayTable.useRecord();
  const ruleType = RuleTypes[type];
  return ruleType
    ? (
      <SchemaComponent
        schema={{
          type: 'object',
          'x-component': 'fieldset',
          properties: ruleType.fieldset
        }}
      />
    )
    : null;
}

function FormButton() {
  const { t } = useTranslation();
  const compile = useCompile();
  const schemaOptions = useContext(SchemaOptionsContext);
  const form = useForm();
  const { type, options } = ArrayTable.useRecord();
  const index = ArrayTable.useIndex();
  const ruleType = RuleTypes[type];
  return (
    <Button
      type="link"
      onClick={() => {
        FormDrawer(compile(ruleType.title), () => {
          return (
            <FormLayout layout="vertical">
              <SchemaComponentOptions scope={schemaOptions.scope} components={schemaOptions.components}>
                <SchemaComponent
                  schema={{
                    type: 'object',
                    'x-component': 'fieldset',
                    properties: ruleType.fieldset
                  }}
                />
              </SchemaComponentOptions>
              <FormDrawer.Footer>
                <Submit
                  onSubmit={(values) => {
                    return values;
                  }}
                >
                  {t('Submit')}
                </Submit>
              </FormDrawer.Footer>
            </FormLayout>
          )
        })
          .open({
            initialValues: options,
          })
          .then((values) => {
            form.setValuesIn(`patterns.${index}`, { type, options: values });
          })
      }}
    >
      {t('Configure')}
    </Button>
  );
}

export const serialString: IField = {
  name: 'serialString',
  type: 'object',
  group: 'advanced',
  order: 2,
  title: '{{t("Serial string")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'code',
      // 'x-component-props': {
      // },
      // 'x-validator': 'array',
    },
  },
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
    unique,
    // patterns: [{ type: 'integer', options: { digits: 1 } }, { type: 'string', options: { value: '123' }}]
    patterns: {
      type: 'array',
      title: '{{t("Serial rules")}}',
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
            'x-component-props': { title: '{{t("Type")}}' },
            // 'x-hidden': true,
            properties: {
              type: {
                type: 'string',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: [
                  { label: '{{t("Autoincrement")}}', value: 'integer' },
                  { label: '{{t("Fixed string")}}', value: 'string' },
                  { label: '{{t("Date")}}', value: 'date' },
                ]
              },
            },
          },
          options: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '{{t("Rule content")}}' },
            properties: {
              description: {
                type: 'void',
                ['x-component'](props) {
                  const row = ArrayTable.useRecord();
                  const ruleType = RuleTypes[row.type];
                  return ruleType?.render?.(row.options) ?? null;
                },
              }
            }
          },
          operations: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: '{{t("Operations")}}',
              dataIndex: 'operations',
              fixed: 'right',
            },
            properties: {
              config: {
                type: 'void',
                title: '{{t("Configure")}}',
                'x-component': FormButton
              },
              configure: {
                type: 'void',
                title: '{{t("Configure")}}',
                'x-component': 'Action.Link',
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues: useRowOptions
                    },
                    title: '{{t("Configure")}}',
                    properties: {
                      options: {
                        type: 'void',
                        'x-component': RuleConfig
                      },
                      actions: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          cancel: {
                            title: '{{t("Cancel")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              // useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          submit: {
                            title: '{{t("Submit")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              // async useAction() {
                              //   const form = useForm();
                              //   const ctx = useActionContext();
                              //   await form.submit();
                              //   console.log(form);
                              //   ctx.setVisible(false);

                              // }
                            }
                          }
                        }
                      }
                    }
                  },
                },
              },
              remove: {
                type: 'void',
                'x-component': 'ArrayTable.Remove',
              }
            }
          }
        }
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayTable.Addition',
          'x-component-props': {
            defaultValue: { type: 'integer' }
          },
          title: "{{t('Add rule')}}",
        }
      }
    }
  },
  filterable: {
    operators: operators.string,
  }
};

import { css } from '@emotion/css';
import { ArrayTable, FormButtonGroup, FormDrawer, FormLayout, Submit } from '@formily/antd';
import { onFieldValueChange } from '@formily/core';
import { SchemaOptionsContext, useForm, useFormEffects } from '@formily/react';
import { Button, Select } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { Cron, SchemaComponent, SchemaComponentOptions, useCompile } from '../../schema-component';
import { defaultProps, operators, unique } from './properties';
import { IField } from './types';

function RuleTypeSelect(props) {
  const compile = useCompile();

  const { setValuesIn } = useForm();
  const index = ArrayTable.useIndex();

  useFormEffects(() => {
    onFieldValueChange(`patterns.${index}.type`, (field) => {
      setValuesIn(`patterns.${index}.options`, {});
    });
  });

  return (
    <Select {...props}>
      {Object.keys(RuleTypes).map(key => (
        <Select.Option key={key} value={key}>{compile(RuleTypes[key].title)}</Select.Option>
      ))}
    </Select>
  );
}

function RuleOptions() {
  const { type, options } = ArrayTable.useRecord();
  const ruleType = RuleTypes[type];
  const compile = useCompile();
  return (
    <div className={css`
      display: flex;
      gap: 1em;
      flex-wrap: wrap;
    `}>
      {Object.keys(options)
        .filter(key => typeof options[key] !== 'undefined')
        .map(key => {
          const Component = ruleType.optionRenders[key];
          const { title } = ruleType.fieldset[key]
          return Component
            ? (
              <dl key={key} className={css`
                margin: 0;
                padding: 0;
              `}>
                <dt>
                  {compile(title)}
                </dt>
                <dd className={css`
                  margin-bottom: 0;
                `}>
                  <Component key={key} value={options[key]} />
                </dd>
              </dl>
            )
            : null;
        })}
    </div>
  );
};

const RuleTypes = {
  string: {
    title: '{{t("Fixed text")}}',
    optionRenders: {
      value(options = { value: '' }) {
        return <code>{options.value}</code>;
      }
    },
    fieldset: {
      value: {
        type: 'string',
        title: '{{t("Text content")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Input'
      }
    }
  },
  integer: {
    title: '{{t("Autoincrement")}}',
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
          min: 1,
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
          const { t } = useTranslation();
          const shortValues = [
            { label: 'No reset', value: 0 },
            { label: 'Daily', value: 1, cron: '0 0 * * *' },
            { label: 'Every Monday', value: 2, cron: '0 0 * * 1' },
            { label: 'Monthly', value: 3, cron: '0 0 1 * *' },
            { label: 'Yearly', value: 4, cron: '0 0 1 1 *' },
            { label: 'Customize', value: 5, cron: '* * * * *' }
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
                  <Select.Option key={item.value} value={item.value}>{t(item.label)}</Select.Option>
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
  },
  date: {
    title: '{{t("Date")}}',
    optionRenders: {
      format(options = { value: 'YYYYMMDD' }) {
        return <code>{options.value}</code>;
      }
    }
  }
};

function RuleConfigForm() {
  const { t } = useTranslation();
  const compile = useCompile();
  const schemaOptions = useContext(SchemaOptionsContext);
  const form = useForm();
  const { type, options } = ArrayTable.useRecord();
  const index = ArrayTable.useIndex();
  const ruleType = RuleTypes[type];
  return ruleType?.fieldset
    ? (
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
                  <FormButtonGroup className={css`
                    justify-content: flex-end;
                  `}>
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
            )
          })
            .open({
              initialValues: options,
            })
            .then((values) => {
              form.setValuesIn(`patterns.${index}`, { type, options: { ...values } });
            })
        }}
      >
        {t('Configure')}
      </Button>
    )
    : null;
}

export const sequence: IField = {
  name: 'sequence',
  type: 'object',
  group: 'advanced',
  order: 3,
  title: '{{t("Sequence")}}',
  sortable: true,
  default: {
    type: 'sequence',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-component-props': {
        readOnly: true,
        disabled: true
      },
      'x-read-pretty': true,
    },
  },
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
    unique,
    patterns: {
      type: 'array',
      title: '{{t("Sequence rules")}}',
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
            'x-component-props': { title: '{{t("Type")}}' },
            // 'x-hidden': true,
            properties: {
              type: {
                type: 'string',
                name: 'type',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': RuleTypeSelect
              },
            },
          },
          options: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '{{t("Rule content")}}' },
            properties: {
              options: {
                type: 'object',
                name: 'options',
                'x-component': RuleOptions
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
              className: css`
                > *:not(:last-child){
                  margin-right: .5em;
                }
                button{
                  padding: 0;
                }
              `
            },
            properties: {
              config: {
                type: 'void',
                // 'x-component': 'span',
                properties: {
                  options: {
                    type: 'object',
                    'x-component': RuleConfigForm
                  }
                }
              },
              // configure: {
              //   type: 'void',
              //   title: '{{t("Configure")}}',
              //   'x-component': 'Action.Link',
              //   properties: {
              //     drawer: {
              //       type: 'void',
              //       'x-component': 'Action.Drawer',
              //       'x-decorator': 'Form',
              //       'x-decorator-props': {
              //         useValues: useRowOptions
              //       },
              //       title: '{{t("Configure")}}',
              //       properties: {
              //         options: {
              //           type: 'void',
              //           'x-component': RuleConfig
              //         },
              //         actions: {
              //           type: 'void',
              //           'x-component': 'Action.Drawer.Footer',
              //           properties: {
              //             cancel: {
              //               title: '{{t("Cancel")}}',
              //               'x-component': 'Action',
              //               'x-component-props': {
              //                 // useAction: '{{ cm.useCancelAction }}',
              //               },
              //             },
              //             submit: {
              //               title: '{{t("Submit")}}',
              //               'x-component': 'Action',
              //               'x-component-props': {
              //                 type: 'primary',
              //                 async useAction() {
              //                   const form = useForm();
              //                   const ctx = useActionContext();
              //                   await form.submit();
              //                   console.log(form);
              //                   ctx.setVisible(false);
              //                 }
              //               }
              //             }
              //           }
              //         }
              //       }
              //     },
              //   },
              // },
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

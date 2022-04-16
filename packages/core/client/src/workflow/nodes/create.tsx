import React from 'react';
import { observer, useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { Select } from 'antd';
import { t } from 'i18next';
import { css } from '@emotion/css';

import { SchemaComponent, useCollectionManager } from '../..';
import { useCollectionFilterOptions } from '../../collection-manager/action-hooks';
import { useFlowContext } from '../WorkflowCanvas';
import { Operand, parseStringValue, VariableTypes, VariableTypesContext, BaseTypeSet } from '../calculators';
import { FormItem } from '@formily/antd';

export default {
  title: '新增',
  type: 'create',
  group: 'model',
  fieldset: {
    collection: {
      type: 'string',
      title: '数据表',
      name: 'collection',
      required: true,
      'x-reactions': ['{{useCollectionDataSource()}}'],
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    // multiple: {
    //   type: 'boolean',
    //   title: '多条数据',
    //   name: 'multiple',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    //   'x-component-props': {
    //     disabled: true
    //   }
    // },
    params: {
      type: 'object',
      name: 'params',
      title: '数据',
      'x-decorator': 'FormItem',
      properties: {
        values: {
          type: 'object',
          title: '',
          name: 'values',
          'x-component': 'DynamicFieldset',
          'x-component-props': {
            useProps() {
              const { values } = useForm();
              return { fields: useCollectionFilterOptions(values.collection) };
            }
          }
        }
      }
    }
  },
  view: {

  },
  scope: {
    useCollectionDataSource() {
      return (field: any) => {
        const { collections = [] } = useCollectionManager();
        action.bound((data: any) => {
          field.dataSource = data.map(item => ({
            label: t(item.title),
            value: item.name
          }));
        })(collections);
      }
    }
  },
  components: {
    // NOTE: observer for watching useProps
    DynamicFieldset: observer(({ value, onChange, useProps }: any) => {
      const { fields } = useProps();

      const VTypes = { ...VariableTypes,
        constant: {
          title: '常量',
          value: 'constant',
          options: undefined
        }
      };

      return (
        <fieldset className={css`
          margin-top: .5em;

          .ant-formily-item{
            .ant-formily-item-label{
              line-height: 32px;
            }

            .ant-select,
            .ant-cascader-picker,
            .ant-picker,
            .ant-input-number,
            .ant-input-affix-wrapper{
              width: auto;
            }
          }
        `}>
          {fields.map(field => {
            const operand = typeof value[field.name] === 'string'
              ? parseStringValue(value[field.name], VTypes)
              : { type: 'constant', value: value[field.name] };

            return (
              <FormItem label={field.title}>
                <VariableTypesContext.Provider value={VTypes}>
                  <Operand
                    value={operand}
                    onChange={(next) => {
                      if (next.type !== operand.type && next.type === 'constant') {
                        onChange({ ...value, [field.name]: null });
                      } else {
                        const { stringify } = VTypes[next.type];
                        onChange({ ...value, [field.name]: stringify(next) });
                      }
                    }}
                  >
                    {operand.type === 'constant'
                      ? <SchemaComponent schema={field.schema} />
                      : null
                    }
                  </Operand>
                </VariableTypesContext.Provider>
              </FormItem>
            );
          })}
        </fieldset>
      );
    })
  },
  getter({ type, options, onChange }) {
    const { collections = [] } = useCollectionManager();
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const collection = collections.find(item => item.name === config.collection) ?? { fields: [] };

    return (
      <Select value={options.path} placeholder="选择字段" onChange={path => {
        onChange({ type, options: { ...options, path } });
      }}>
        {collection.fields
          .filter(field => BaseTypeSet.has(field.uiSchema.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{t(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};

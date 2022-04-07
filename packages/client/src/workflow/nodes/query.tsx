import React, { useState } from 'react';
import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { Cascader, Select } from 'antd';
import { t } from 'i18next';
import { css } from '@emotion/css';

import { useCollectionManager } from '../..';
import { useCollectionFilterOptions } from '../../collection-manager/action-hooks';
import { useFlowContext } from '../WorkflowCanvas';
import { parseStringValue, VariableTypes } from '../calculators';

const BaseTypeSet = new Set(['boolean', 'number', 'string', 'date']);

export default {
  title: '数据查询',
  type: 'query',
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
    multiple: {
      type: 'boolean',
      title: '多条数据',
      name: 'multiple',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-component-props': {
        disabled: true
      }
    },
    params: {
      type: 'object',
      name: 'params',
      title: '查询参数',
      'x-decorator': 'FormItem',
      properties: {
        filter: {
          type: 'object',
          title: '筛选条件',
          name: 'filter',
          'x-decorator': 'div',
          'x-decorator-props': {
            className: css`
              .ant-select{
                width: auto;
              }
            `
          },
          'x-component': 'Filter',
          'x-component-props': {
            useProps() {
              const { values } = useForm();
              const options = useCollectionFilterOptions(values.collection);
              return { options };
            },
            dynamicComponent: 'VariableComponent'
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
    VariableComponent({ value, onChange, renderSchemaComponent }) {
      const VTypes = { ...VariableTypes,
        constant: {
          title: '常量',
          value: 'constant',
          options: undefined
        }
      };

      const operand = typeof value === 'string'
        ? parseStringValue(value, VTypes)
        : { type: 'constant', value };

      const { component, appendTypeValue } = VTypes[operand.type];
      const [types, setTypes] = useState([operand.type, ...(appendTypeValue ? appendTypeValue(operand) : [])]);
      const [type] = types;

      const VariableComponent = typeof component === 'function' ? component(operand) : component;

      return (
        <div className={css`
          display: flex;
          gap: .5em;
          align-items: center;
        `}>
          <Cascader
            allowClear={false}
            value={types}
            options={Object.values(VTypes).map(item => {
              const children = typeof item.options === 'function' ? item.options() : item.options;
              return {
                label: item.title,
                value: item.value,
                children,
                disabled: children && !children.length,
                isLeaf: !children
              };
            })}
            onChange={(next: Array<any>) => {
              const { onTypeChange, stringify } = VTypes[next[0]];
              setTypes(next);
              if (typeof onTypeChange === 'function') {
                onTypeChange(operand, next, (op) => {
                  onChange(stringify(op));
                });
              } else {
                if (next[0] !== type) {
                  onChange(null);
                }
              }
            }}
          />
          {type === 'constant'
            ? renderSchemaComponent()
            : <VariableComponent {...operand} onChange={(v) => {
              const { stringify } = VTypes[type];
              onChange(stringify(v));
            }} />
          }
        </div>
      );
    }
  },
  getter({ options, onChange }) {
    const { collections = [] } = useCollectionManager();
    const { nodes } = useFlowContext();
    const { config } = nodes.find(n => n.id == options.nodeId);
    const collection = collections.find(item => item.name === config.collection) ?? { fields: [] };

    return (
      <Select value={options.path} placeholder="选择字段" onChange={path => onChange({ options: { ...options, path } })}>
        {collection.fields
          .filter(field => BaseTypeSet.has(field.uiSchema.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{t(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};

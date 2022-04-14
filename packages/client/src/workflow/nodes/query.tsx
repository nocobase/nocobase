import React from 'react';
import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { Select } from 'antd';
import { t } from 'i18next';
import { css } from '@emotion/css';

import { useCollectionManager } from '../..';
import { useCollectionFilterOptions } from '../../collection-manager/action-hooks';
import { useFlowContext } from '../WorkflowCanvas';
import { Operand, parseStringValue, VariableTypes, VariableTypesContext, BaseTypeSet } from '../calculators';

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

      return (
        <VariableTypesContext.Provider value={VTypes}>
          <Operand
            value={operand}
            onChange={(next) => {
              if (next.type !== operand.type && next.type === 'constant') {
                onChange(null);
              } else {
                const { stringify } = VTypes[next.type];
                onChange(stringify(next));
              }
            }}
          >
            {operand.type === 'constant' ? renderSchemaComponent() : null}
          </Operand>
        </VariableTypesContext.Provider>
      );
    }
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

import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCollectionManager, useCollection } from '../../collection-manager';
import { DynamicComponent } from './DynamicComponent';
import { useCompile } from '../../schema-component';
const { Option } = Select;
import { VariableTextArea } from './component/VariableTextArea';

const VariableTypes = (currentCollection) => {
  const { getCollectionFields, getInterface, getCollection } = useCollectionManager();
  const collection = getCollection(currentCollection);
  return [
    {
      title: collection.title,
      value: currentCollection,
      options(fields) {
        const field2option = (field, depth) => {
          if (!field.interface) {
            return;
          }
          const fieldInterface = getInterface(field.interface);
          if (!fieldInterface.filterable) {
            return;
          }
          const { nested, children, operators } = fieldInterface.filterable;
          const option = {
            key: field.name,
            label: field?.title || field.uiSchema?.title,
            schema: field?.uiSchema,
            value: field.name,
          };
          if (field.target && depth > 2) {
            return;
          }
          if (depth > 2) {
            return option;
          }
          if (children?.length) {
            option['children'] = children;
          }
          if (nested) {
            const targetFields = getCollectionFields(field.target);
            const options = getOptions(targetFields, depth + 1).filter(Boolean);
            option['children'] = option['children'] || [];
            option['children'].push(...options);
          }
          return option;
        };
        const getOptions = (fields, depth) => {
          const options = [];
          fields.forEach((field) => {
            const option = field2option(field, depth);
            if (option) {
              options.push(option);
            }
          });
          return options;
        };
        return getOptions(fields, 1);
      },
    },
    {
      title: `{{t("System variables")}}`,
      value: '$system',
      options: [
        {
          key: 'now',
          value: 'now',
          label: `{{t("Current time")}}`,
        },
      ],
    },
  ];
};

export function useVariableOptions(fields, collectionName) {
  const compile = useCompile();
  const options = VariableTypes(collectionName).map((item: any) => {
    const options = typeof item.options === 'function' ? item.options(fields) : item.options;
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(options),
      disabled: options && !options.length,
    };
  });
  return options;
}
export const ValueDynamicComponent = (props) => {
  const { fieldValue, schema, setValue, fields, collectionName } = props;
  const [mode, setMode] = useState(fieldValue?.mode || 'constant');
  const { t } = useTranslation();
  const scope = useVariableOptions(fields, collectionName);
  return (
    <Input.Group compact style={{ minWidth: 280 }}>
      <Select value={mode} style={{ width: '32%', maxWidth: '100px' }} onChange={(value) => setMode(value)}>
        <Option value="constant">{t('Constant value')}</Option>
        <Option value="express">{t('Expression')}</Option>
      </Select>
      <div style={{ width: '68%' }}>
        {mode === 'constant' ? (
          React.createElement(DynamicComponent, {
            value: fieldValue?.value || fieldValue,
            schema,
            onChange(value) {
              setValue({
                mode,
                value,
              });
            },
          })
        ) : (
          <VariableTextArea
            value={fieldValue?.value}
            onChange={(value) => {
              const result = value.replaceAll(`${collectionName}.`, '').replaceAll('$system.', '').trim();
              setValue({
                mode,
                value,
                result,
              });
            }}
            scope={scope}
            style={{ minWidth: 460, marginRight: 15 }}
          />
        )}
      </div>
    </Input.Group>
  );
};

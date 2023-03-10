import React from "react";
import { Field } from '@formily/core';
import { useForm, useField, observer, Schema, RecursionField } from '@formily/react';
import { FormLayout } from '@formily/antd';

import { SchemaComponent, SchemaComponentOptions, useCollectionDataSource, useCollectionManager, useCompile, Variable } from "@nocobase/client";

import { NAMESPACE } from "../locale";
import { options as evaluatorsOptions } from "@nocobase/evaluators/client";



const DynamicExpression = observer((props) => {
  // @ts-ignore
  const { value, onChange } = props;
  const compile = useCompile();
  const { getValuesIn } = useForm();
  const { address } = useField();
  const current = address.parent().segments.pop();
  const collection = getValuesIn([current, 'collection']);
  console.log('-----', collection);

  const { interfaces, getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection)
    .filter(field => field.name !== current);
  const options = fields.map(field => ({
    label: compile(field.uiSchema.title),
    value: field.name,
    children: interfaces[field.interface].usePathOptions?.(field)
  }));

  return (
    <Variable.TextArea
      value={value}
      onChange={onChange}
      scope={options}
    />
  );
});

export function DynamicExpressionConfig(props) {
  const field = useField<Field>();

  return (
    <FormLayout layout="vertical">
      <SchemaComponentOptions scope={{ useCollectionDataSource }} components={{ DynamicExpression }}>
        <RecursionField
          basePath={field.address}
          onlyRenderProperties
          schema={new Schema({
            properties: {
              engine: {
                type: 'string',
                title: `{{t("Engine", { ns: "${NAMESPACE}" })}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                enum: evaluatorsOptions,
                required: true,
                default: 'math.js',

              },
              collection: {
                type: 'string',
                title: '{{t("Collection")}}',
                required: true,
                'x-reactions': ['{{useCollectionDataSource()}}'],
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  placeholder: '{{t("Select collection")}}'
                }
              },
              expression: {
                type: 'string',
                title: `{{t("Expression", { ns: "${NAMESPACE}" })}}`,
                required: true,
                'x-component': 'DynamicExpression',
                'x-decorator': 'FormItem',
              }
            }
          })}
        />
      </SchemaComponentOptions>
    </FormLayout>
  );
}

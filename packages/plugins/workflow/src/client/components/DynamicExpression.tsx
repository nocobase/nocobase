import React from "react";
import { Field, onFieldValueChange } from '@formily/core';
import { connect, useForm, useField, useFormEffects, observer, Schema, RecursionField, mapReadPretty } from '@formily/react';
import { FormLayout } from '@formily/antd';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';

import { SchemaComponentOptions, useCollectionDataSource, useCollectionManager, useCompile, Variable } from "@nocobase/client";

import { NAMESPACE } from "../locale";
import { getOptions } from "@nocobase/evaluators/client";



const InternalDynamicExpression = observer<any>((props) => {
  const { value, onChange } = props;
  const compile = useCompile();
  const { getValuesIn } = useForm();
  const { address } = useField();
  const { segments } = address.parent();
  const current = segments[segments.length - 1];
  const collection = getValuesIn([current, 'collection']);

  const { interfaces, getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection)
    .filter(field => field.name !== current);
  const options: any[] = [];
  fields.forEach(field => {
    if (field.type === 'belongsTo') {
      options.push({
        label: `${compile(field.uiSchema?.title || field.name)} ID`,
        value: field.foreignKey,
      });
    }
    options.push({
      label: compile(field.uiSchema?.title),
      value: field.name,
      children: interfaces[field.interface]?.usePathOptions?.(field)
    });
  });

  return (
    <Variable.TextArea
      value={value}
      onChange={onChange}
      scope={options}
    />
  );
});

function Config() {
  const field = useField<Field>();
  const { setValuesIn, getValuesIn } = useForm();
  const form = useForm();

  useFormEffects(() => {
    onFieldValueChange(field.address.concat('collection'), (f) => {
      setValuesIn(field.address.concat('expression').segments, null);
    });
  });

  return (
    <FormLayout layout="horizontal" className={css`
      .ant-formily-item-label{
        line-height: 32px;
      }
    `}>
      <SchemaComponentOptions scope={{ useCollectionDataSource }} components={{ InternalDynamicExpression }}>
        <RecursionField
          onlyRenderProperties
          schema={new Schema({
            properties: {
              engine: {
                type: 'string',
                title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                enum: getOptions(),
                default: 'math.js',
              },
              collection: {
                type: 'string',
                title: '{{t("Collection")}}',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  placeholder: '{{t("Select collection")}}'
                },
                'x-reactions': [
                  '{{useCollectionDataSource()}}',
                  // {
                  //   target: 'expression',
                  //   effects: ['onFieldValueChange'],
                  //   fulfill: {
                  //     state: {
                  //       value: null,
                  //     }
                  //   }
                  // }
                ],
              },
              expression: {
                type: 'string',
                title: '{{t("Expression")}}',
                required: true,
                'x-component': 'InternalDynamicExpression',
                'x-decorator': 'FormItem',
              }
            }
          })}
        />
      </SchemaComponentOptions>
    </FormLayout>
  );
}

type Value = {
  engine?: string;
  collection?: string;
  expression?: string;
};

function Result({ value }: { value: Value }) {
  const { collection, expression } = value ?? {};
  const { t } = useTranslation();
  return collection && expression
    ? <Tag color="purple">{t('Expression')}</Tag>
    : <Tag>{t('Unconfigured', { ns: NAMESPACE })}</Tag>;
}

export const DynamicExpression = connect(Config, mapReadPretty(Result));

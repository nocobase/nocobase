import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { RemoveConditionContext } from './context';
import { DynamicComponent } from './DynamicComponent';
import { useValues } from './useValues';
import { useCollectionManager, useCollection } from '../../../collection-manager/hooks';

export const FilterItem = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const remove = useContext(RemoveConditionContext);
  const { schema, fields, operators, dataIndex, operator, setDataIndex, setOperator, value, setValue } = useValues();
  const { getChildrenCollections } = useCollectionManager();
  const collection = useCollection();
  const childrenCollections = getChildrenCollections(collection.name);
  if (childrenCollections.length > 0 && !fields.find((v) => v.name == 'tableoid')) {
    fields.push({
      name: 'tableoid',
      type: 'string',
      title: '{{t("Table OID(Inheritance)")}}',
      schema: {
        'x-component': 'Select',
        enum: [{ value: collection.name, label: t(collection.title) }].concat(
          childrenCollections.map((v) => {
            return {
              value: v.name,
              label: t(v.title),
            };
          }),
        ),
      },
      operators: [
        {
          label: '{{t("contains")}}',
          value: '$childIn',
          schema: {
            'x-component': 'Select',
            'x-component-props': { mode: 'tags' },
          },
        },
        {
          label: '{{t("does not contain")}}',
          value: '$childNotIn',
          schema: {
            'x-component': 'Select',
            'x-component-props': { mode: 'tags' },
          },
        },
      ],
    });
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Cascader
          className={css`
            width: 160px;
          `}
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          changeOnSelect={false}
          value={dataIndex}
          options={compile(fields)}
          onChange={(value) => {
            setDataIndex(value);
          }}
          placeholder={t('Select Field')}
        />
        <Select
          className={css`
            min-width: 110px;
          `}
          value={operator?.value}
          options={compile(operators)}
          onChange={(value) => {
            setOperator(value);
          }}
          placeholder={t('Comparision')}
        />
        {!operator?.noValue &&
          React.createElement(DynamicComponent, {
            value,
            schema,
            onChange(value) {
              setValue(value);
            },
          })}
        {!props.disabled && (
          <a>
            <CloseCircleOutlined onClick={() => remove()} style={{ color: '#bfbfbf' }} />
          </a>
        )}
      </Space>
    </div>
  );
});

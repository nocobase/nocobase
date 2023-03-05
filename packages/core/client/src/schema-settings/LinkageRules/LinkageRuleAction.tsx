import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { TreeSelect } from '@formily/antd';
import {  Select, Space } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { RemoveActionContext } from './context';
import { DynamicComponent } from './DynamicComponent';
import { useValues } from './useValues';
import { ActionType } from './type';
import { ValueDynamicComponent } from './ValueDynamicComponent';

export const FormFieldLinkageRuleAction = observer((props: any) => {
  const { value, options, collectionName } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const remove = useContext(RemoveActionContext);
  const {
    schema,
    fields,
    operator,
    setDataIndex,
    setOperator,
    setValue,
    value: fieldValue,
    operators,
  } = useValues(options);
  return (
    <div style={{ marginBottom: 8 }}>
      <Space
        className={css`
          .ant-space-item {
            max-width: 95%;
          }
        `}
      >
        <TreeSelect
          className={css`
            min-width: 160px;
          `}
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          treeCheckable={true}
          value={value?.targetFields}
          multiple
          allowClear
          treeData={compile(fields)}
          onChange={(value) => {
            console.log(value)
            setDataIndex(value);
          }}
          placeholder={t('Select Field')}
        />
        <Select
          value={operator}
          className={css`
            min-width: 120px;
          `}
          options={compile(operators)}
          onChange={(value) => {
            setOperator(value);
          }}
          placeholder={t('action')}
        />
        {[ActionType.Value].includes(operator) && (
          <ValueDynamicComponent
            fieldValue={fieldValue}
            schema={schema}
            setValue={setValue}
            collectionName={collectionName}
          />
        )}
        {!props.disabled && (
          <a>
            <CloseCircleOutlined onClick={() => remove()} style={{ color: '#bfbfbf' }} />
          </a>
        )}
      </Space>
    </div>
  );
});

export const FormButtonLinkageRuleAction = observer((props: any) => {
  const { value, options } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const [editFalg, setEditFlag] = useState(false);
  const remove = useContext(RemoveActionContext);
  const { schema, operator, setOperator, setValue } = useValues(options);
  const operators = [
    { label: t('Visible'), value: ActionType.Visible, schema: {} },
    { label: t('Hidden'), value: ActionType.Hidden, schema: {} },
    { label: t('Disabled'), value: ActionType.Disabled, schema: {} },
    { label: t('Enabled'), value: ActionType.Active, schema: {} },
  ];
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Select
          value={operator}
          options={compile(operators)}
          onChange={(value) => {
            const flag = [ActionType.Value].includes(value);
            setEditFlag(flag);
            setOperator(value);
          }}
          placeholder={t('action')}
        />
        {editFalg &&
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

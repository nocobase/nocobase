import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { ArrayField, connect, useField,ObjectField } from '@formily/react';
import { ArrayField as ArrayFieldModel } from '@formily/core';

import { Cascader, Select, Space } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { RemoveActionContext } from './context';
import { DynamicComponent } from '../../schema-component/antd/filter/DynamicComponent';
import { useValues } from './useValues';
import { ActionType } from './type';
import {LinkageRuleAction} from './LinkageRuleAction'
export const LinkageRuleActions = observer((props: any):any => {
  const { t } = useTranslation();
  const compile = useCompile();
  const remove = useContext(RemoveActionContext);
  const { schema, fields, targetFields, operator, setDataIndex, setOperator, value, setValue } = useValues();
  const [editFalg, setEditFlag] = useState(false);
  const field = useField<ArrayFieldModel>();
  console.log(field.value);

  return field?.value?.map((item, index) => {
    return (
      <RemoveActionContext.Provider key={index} value={() => field.remove(index)}>
        {/* <div style={{ marginBottom: 8 }}>
          <Space>
            <Cascader
              className={css`
                min-width: 160px;
              `}
              fieldNames={{
                label: 'title',
                value: 'name',
                children: 'children',
              }}
              changeOnSelect={false}
              value={targetFields}
              multiple
              options={compile(fields)}
              onChange={(value) => {
                setDataIndex(value);
              }}
              placeholder={t('Select Field')}
            />
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
        </div> */}
                    <ObjectField name={index} component={[LinkageRuleAction]} />

      </RemoveActionContext.Provider>
    );
  });
});

export const LinkageRuleActionGroup = (props) => {
  const { t } = useTranslation();
  const field = useField<any>();
  const logic = 'action';
  return (
    <div style={{ marginLeft: 10 }}>
      <ArrayField name={logic} component={[LinkageRuleActions]} disabled={false} initialValue={props.value} />
      <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
        <a
          onClick={() => {
            const value = field.value || {};
            const items = value[logic] || [];
            items.push({});
            field.value = {
              [logic]: items,
            };
          }}
        >
          {t('Add action')}
        </a>
      </Space>
    </div>
  );
};

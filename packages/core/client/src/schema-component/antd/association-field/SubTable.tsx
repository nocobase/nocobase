import { ArrayField } from '@formily/core';
import { exchangeArrayState } from '@formily/core/esm/shared/internals';
import { isArr } from '@formily/shared';
import { action } from '@formily/reactive';
import { observer } from '@formily/react';
import { Button } from 'antd';
import { FormItem } from '@formily/antd';
import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext } from './hooks';

export const SubTable: any = observer(
  (props: any) => {
    const { field } = useAssociationFieldContext<ArrayField>();
    const { t } = useTranslation();
    const move = (fromIndex: number, toIndex: number) => {
      if (toIndex === undefined) return;
      if (!isArr(field.value)) return;
      if (fromIndex === toIndex) return;
      return action(() => {
        const fromItem = field.value[fromIndex];
        field.value.splice(fromIndex, 1);
        field.value.splice(toIndex, 0, fromItem);
        exchangeArrayState(field, {
          fromIndex,
          toIndex,
        });
        return field.onInput(field.value);
      });
    };
    field.move = move;
    return (
      <div
        className={css`
          .ant-formily-item-error-help {
            display: none;
          }
          .ant-description-textarea {
            line-height: 34px;
          }
          .ant-table-cell .ant-formily-item-error-help {
            display: block;
            position: absolute;
            font-size: 12px;
            top: 100%;
            background: #fff;
            width: 100%;
            margin-top: 3px;
            padding: 3px;
            z-index: 1;
            border-radius: 3px;
            box-shadow: 0 0 10px #eee;
            animation: none;
            transform: translateY(0);
            opacity: 1;
          }
        `}
      >
        <FormItem labelStyle={{ display: 'none' }} wrapperStyle={{ marginBottom: -25 }}>
          <Table
            className={css`
              .ant-select-selector {
                min-height: 31px;
              }
              .ant-formily-item {
                margin-bottom: 0px;
              }
              .ant-formily-editable {
                vertical-align: sub;
              }
              .ant-table table {
                margin-bottom: 20px;
              }
            `}
            size={'small'}
            field={field}
            showIndex
            dragSort={field.editable}
            showDel={field.editable}
            pagination={false}
            rowSelection={{ type: 'none', hideSelectAll: true }}
          />
        </FormItem>
        {field.editable && (
          <Button
            type={'dashed'}
            block
            onClick={() => {
              field.value = field.value || [];
              field.value.push({});
              field.onInput(field.value);
            }}
          >
            {t('Add new')}
          </Button>
        )}
      </div>
    );
  },
  { displayName: 'SubTable' },
);

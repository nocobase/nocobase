import { PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { exchangeArrayState } from '@formily/core/esm/shared/internals';
import { observer } from '@formily/react';
import { action } from '@formily/reactive';
import { isArr } from '@formily/shared';
import { Button } from 'antd';
import React from 'react';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext } from './hooks';

export const SubTable: any = observer(
  (props: any) => {
    const { field } = useAssociationFieldContext<ArrayField>();
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
          .ant-table-footer {
            padding: 0 !important;
          }
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
            margin-top: -15px;
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
        <Table
          className={css`
            .ant-formily-item.ant-formily-item-feedback-layout-loose {
              margin-bottom: 0px !important;
            }
            .ant-formily-editable {
              vertical-align: sub;
            }
          `}
          bordered
          size={'small'}
          field={field}
          showIndex
          dragSort={field.editable}
          showDel={field.editable}
          pagination={false}
          rowSelection={{ type: 'none', hideSelectAll: true }}
          footer={() =>
            field.editable && (
              <Button
                type={'text'}
                block
                className={css`
                  display: block;
                `}
                onClick={() => {
                  field.value = field.value || [];
                  field.value.push({});
                  field.onInput(field.value);
                }}
                icon={<PlusOutlined />}
              >
                {/* {t('Add new')} */}
              </Button>
            )
          }
          isSubTable={true}
        />
      </div>
    );
  },
  { displayName: 'SubTable' },
);

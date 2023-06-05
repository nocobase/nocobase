import { ArrayField } from '@formily/core';
import { observer, useFieldSchema } from '@formily/react';
import { Button } from 'antd';
import { FormItem } from '@formily/antd';
import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext } from './hooks';

export const SubTable: any = observer((props: any) => {
  const { field } = useAssociationFieldContext<ArrayField>();
  const { t } = useTranslation();
  return (
    <div>
      <FormItem feedbackLayout="none" labelStyle={{ display: 'none' }}>
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
          style={{ marginTop: 12 }}
          onClick={() => {
            field.value = field.value || [];
            field.value.push({});
          }}
        >
          {t('Add new')}
        </Button>
      )}
    </div>
  );
});

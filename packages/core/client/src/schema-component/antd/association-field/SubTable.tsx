import { ArrayField } from '@formily/core';
import { observer } from '@formily/react';
import { Button } from 'antd';
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
      <Table
        className={css`
          .ant-select-selector {
            height: 100%;
          }
        `}
        size={'small'}
        field={field}
        showIndex
        dragSort={field.editable}
        showDel={field.editable}
        pagination={false}
        rowSelection={{ type: 'none' }}
      />
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

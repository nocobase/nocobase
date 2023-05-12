import { ArrayField } from '@formily/core';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext } from './hooks';

export const SubTable: any = observer((props: any) => {
  const { field } = useAssociationFieldContext<ArrayField>();
  const { t } = useTranslation();
  return (
    <div>
      <Table size={'small'} field={field} showIndex dragSort={field.editable} pagination={false} rowSelection={{type:'none'}}  />
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

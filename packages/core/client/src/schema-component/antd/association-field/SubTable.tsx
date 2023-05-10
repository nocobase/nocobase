import { ArrayField } from '@formily/core';
import { observer } from '@formily/react';
import { Button } from 'antd';
import React from 'react';
import { Table } from '../table-v2/Table';
import { useAssociationFieldContext } from './hooks';

export const SubTable: any = observer((props) => {
  const { field } = useAssociationFieldContext<ArrayField>();
  return (
    <div>
      <Table size={'small'} showIndex field={field} pagination={false} />
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
          Add new
        </Button>
      )}
    </div>
  );
});

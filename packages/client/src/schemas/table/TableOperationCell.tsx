import React, { useContext } from 'react';
import { observer, RecursionField } from '@formily/react';
import { TableRowContext } from './context';

export const TableOperationCell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  return (
    <div className={'nb-table-column'}>
      <RecursionField schema={schema} name={ctx.index} onlyRenderProperties />
    </div>
  );
});

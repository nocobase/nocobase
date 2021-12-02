import React, { useContext, useEffect } from 'react';
import { observer } from '@formily/react';
import { useDesignable } from '..';
import { useDisplayedMapContext } from '../../constate';
import { useCompile } from '../../hooks/useCompile';
import { CollectionFieldContext } from './context';

export const TableColumn = observer((props: any) => {
  const collectionField = useContext(CollectionFieldContext);
  const { schema, DesignableBar } = useDesignable();
  const compile = useCompile();
  const displayed = useDisplayedMapContext();
  useEffect(() => {
    if (collectionField?.name) {
      displayed.set(collectionField.name, schema);
    }
  }, [collectionField, schema]);
  return (
    <div className={'nb-table-column'}>
      {compile(schema.title || collectionField?.uiSchema?.title)}
      <DesignableBar />
    </div>
  );
});

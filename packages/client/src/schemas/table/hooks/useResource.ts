import { useContext } from 'react';
import { Schema } from '@formily/react';
import { useTable } from './useTable';
import { TableRowContext } from '../context';
import useRequest from '@ahooksjs/use-request';
import { useCollectionContext, useResourceRequest } from '../../../constate';
import { useDesignable } from '../..';

export const useResource = ({ onSuccess, manual = true }) => {
  const { props } = useTable();
  const { collection } = useCollectionContext();
  const ctx = useContext(TableRowContext);
  const resource = useResourceRequest({
    resourceName: collection?.name || props.collectionName,
    resourceIndex: ctx.record[props.rowKey],
  });
  const { schema } = useDesignable();
  const fieldFields = (schema: Schema) => {
    const names = [];
    schema.reduceProperties((buf, current) => {
      if (current['x-component'] === 'Form.Field') {
        const fieldName = current['x-component-props']?.['fieldName'];
        if (fieldName) {
          buf.push(fieldName);
        }
      } else {
        const fieldNames = fieldFields(current);
        buf.push(...fieldNames);
      }
      return buf;
    }, names);
    return names;
  };
  console.log(
    'collection?.name || props.collectionName',
    collection?.name || props.collectionName,
    // fieldFields(schema),
  );
  const service = useRequest(
    (params?: any) => {
      console.log('Table.useResource', params);
      return resource.get({ ...params, appends: fieldFields(schema) });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual,
    },
  );
  return { resource, service, initialValues: service.data, ...service };
};

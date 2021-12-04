import { useContext, useEffect } from 'react';
import { useTable } from './useTable';
import useRequest from '@ahooksjs/use-request';
import { useCollectionContext, useResourceRequest } from '../../../constate';
import { VisibleContext } from '../../../context';
import { TableRowContext } from '../context';

export const useActionLogDetailsResource = ({ onSuccess }) => {
  const { props } = useTable();
  const { collection } = useCollectionContext();
  const ctx = useContext(TableRowContext);
  const resource = useResourceRequest({
    resourceName: 'action_logs',
    resourceIndex: ctx.record[props.rowKey],
  });
  const service = useRequest(
    (params?: any) => {
      return resource.get({
        ...params,
        appends: ['changes', 'user', 'collection'],
      });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

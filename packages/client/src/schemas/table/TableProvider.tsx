import React, { useState } from 'react';
import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { uid } from '@formily/shared';
import useRequest from '@ahooksjs/use-request';
import { useDeepCompareEffectNoCheck } from 'use-deep-compare-effect';
import { useResource as useGeneralResource } from '../../hooks/useResource';
import { useDesignable } from '..';
import { useCollectionContext } from '../../constate';
import { useDefaultSelectedRowKeys } from './hooks/useDefaultSelectedRowKeys';
import { usePagination } from './hooks/usePagination';
import { useCollectionFields } from './hooks/useCollectionFields';
import { TableContext } from './context';
import { TableMain } from './TableMain';

export const TableProvider = (props: any) => {
  const {
    rowKey = 'id',
    dataRequest,
    useResource = useGeneralResource,
    defaultSelectedRowKeys,
    useSelectedRowKeys = useDefaultSelectedRowKeys,
    ...others
  } = props;
  const { schema } = useDesignable();
  const field = useField<ArrayField>();
  const [pagination, setPagination] = usePagination();
  const { selectedRowKeys, setSelectedRowKeys } = useSelectedRowKeys();
  console.log('props.useSelectedRowKeys', selectedRowKeys);
  const [, refresh] = useState(uid());
  const { resource } = useResource();
  const { sortableField } = useCollectionContext();
  const dragSort = props.dragSort;
  const collectionFields = useCollectionFields(schema);
  // console.log({ collectionFields, pagination });
  const getDefaultParams = () => {
    const defaultParams = { ...pagination };
    if (dragSort) {
      defaultParams['sort'] = [sortableField || 'sort'];
    } else {
      defaultParams['sort'] = (props.defaultSort || []).join(',');
    }
    defaultParams['defaultAppends'] = [...(props.defaultAppends || []), ...collectionFields];
    if (props.defaultFilter) {
      defaultParams['defaultFilter'] = props.defaultFilter;
    }
    console.log({ defaultParams });
    return defaultParams;
  };
  const service = useRequest(
    (params?: any) => {
      if (!resource) {
        return Promise.resolve({
          list: field.value,
          total: field?.value?.length,
        });
      }
      return resource.list(params).then((res) => {
        return {
          list: res?.data || [],
          total: res?.meta?.count || res?.data?.length,
        };
      });
    },
    {
      onSuccess(data: any) {
        field.setValue(data?.list || []);
      },
      manual: true,
      // defaultParams: [getDefaultParams()],
    },
  );
  useDeepCompareEffectNoCheck(() => {
    service.run(getDefaultParams());
  }, [pagination?.pageSize, pagination?.page, props.dragSort, props.defaultSort, props.defaultFilter]);
  return (
    <TableContext.Provider
      value={{
        resource,
        refresh: () => {
          const { page = 1, pageSize } = pagination;
          const total = props.clientSidePagination ? field?.value?.length : service?.data?.total;
          const maxPage = Math.ceil(total / pageSize);
          if (page > maxPage) {
            setPagination({ page: maxPage });
          } else {
            refresh(uid());
          }
        },
        selectedRowKeys,
        setSelectedRowKeys,
        pagination,
        setPagination,
        service,
        field,
        schema,
        props: { ...others, rowKey, dataRequest },
      }}
    >
      <TableMain />
    </TableContext.Provider>
  );
};

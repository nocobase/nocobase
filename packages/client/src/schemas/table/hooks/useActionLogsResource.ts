import React, { useContext, createContext, useEffect, useState } from 'react';
import { useTable } from './useTable';
import { ListOptions, Resource } from '../../../resource';
import { TableRowContext } from '../context';
import { useResourceRequest } from '../../../constate';

export const useActionLogsResource = (options: any = {}) => {
  const { props } = useTable();
  const ctx = useContext(TableRowContext);

  class ActionLogoResource extends Resource {
    list(options?: ListOptions) {
      console.log({ options });
      let defaultFilter = options?.defaultFilter;
      if (ctx?.record) {
        const extra = {
          index: ctx?.record?.id,
          collection_name: props.collectionName,
        };
        if (defaultFilter) {
          defaultFilter = { and: [defaultFilter, extra] };
        } else {
          defaultFilter = extra;
        }
      }
      return super.list({ ...options, defaultFilter });
    }
  }

  const resource = useResourceRequest('action_logs', ActionLogoResource);

  return {
    resource,
  };
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useRef } from 'react';
import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { get } from 'lodash';
import {
  BlockRequestContext_deprecated,
  CollectionProvider_deprecated,
  FormBlockContext,
  RecordProvider,
  RerenderDataBlockProvider,
  parseCollectionName,
  useAPIClient,
  useAssociationNames,
  useBlockRequestContext,
} from '@nocobase/client';

import { useFlowContext } from '../FlowContext';

function useFlowContextData(dataPath) {
  const { execution, nodes } = useFlowContext();

  const nodesKeyMap = useMemo(() => {
    return nodes.reduce((map, node) => Object.assign(map, { [node.id]: node.key }), {});
  }, [nodes]);

  const data = useMemo(
    () => ({
      $context: execution?.context,
      $jobsMapByNodeKey: (execution?.jobs ?? []).reduce(
        (map, job) => Object.assign(map, { [nodesKeyMap[job.nodeId]]: job.result }),
        {},
      ),
    }),
    [execution?.context, execution?.jobs, nodesKeyMap],
  );

  const result = useMemo(() => get(data, dataPath), [data, dataPath]);
  return result;
}

export function DetailsBlockProvider({ collection, dataPath, children }) {
  const field = useField();
  const formBlockRef = useRef(null);
  const { getAssociationAppends } = useAssociationNames();
  const { appends, updateAssociationValues } = getAssociationAppends();
  const values = useFlowContextData(dataPath);
  let dataSourceName, resolvedCollection;
  if (typeof collection === 'string') {
    const parsed = parseCollectionName(collection);
    dataSourceName = parsed[0];
    resolvedCollection = parsed[1];
  } else {
    resolvedCollection = collection;
  }

  const form = useMemo(
    () =>
      createForm({
        values,
        readPretty: true,
      }),
    [values],
  );

  const params = {
    appends,
  };
  const service = {
    loading: false,
    data: {
      data: values,
    },
  };
  const api = useAPIClient();
  const resource = api.resource(resolvedCollection);
  const __parent = useBlockRequestContext();

  return (
    <CollectionProvider_deprecated dataSource={dataSourceName} collection={resolvedCollection}>
      <RecordProvider record={values} parent={null}>
        <RerenderDataBlockProvider>
          <BlockRequestContext_deprecated.Provider value={{ block: 'form', field, service, resource, __parent }}>
            <FormBlockContext.Provider
              value={{
                params,
                form,
                field,
                service,
                updateAssociationValues,
                formBlockRef,
              }}
            >
              {children}
            </FormBlockContext.Provider>
          </BlockRequestContext_deprecated.Provider>
        </RerenderDataBlockProvider>
      </RecordProvider>
    </CollectionProvider_deprecated>
  );
}

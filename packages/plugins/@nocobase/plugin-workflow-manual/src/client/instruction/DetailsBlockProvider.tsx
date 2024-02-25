import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import {
  BlockRequestContext,
  CollectionProvider,
  FormBlockContext,
  RecordProvider,
  useAPIClient,
  useAssociationNames,
} from '@nocobase/client';
import { useFlowContext } from '@nocobase/plugin-workflow/client';
import { parse } from '@nocobase/utils/client';
import React, { useContext, useMemo, useRef } from 'react';

function useFlowContextData(dataSource) {
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

  const result = useMemo(() => parse(dataSource)(data), [data, dataSource]);
  return result;
}

export function DetailsBlockProvider(props) {
  const field = useField();
  const formBlockRef = useRef(null);
  const { getAssociationAppends } = useAssociationNames();
  const { appends, updateAssociationValues } = getAssociationAppends();
  const values = useFlowContextData(props.dataSource);

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
  const resource = api.resource(props.collection);
  const __parent = useContext(BlockRequestContext);

  return (
    <CollectionProvider collection={props.collection}>
      <RecordProvider record={values} parent={false}>
        <BlockRequestContext.Provider value={{ block: 'form', field, service, resource, __parent }}>
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
            {props.children}
          </FormBlockContext.Provider>
        </BlockRequestContext.Provider>
      </RecordProvider>
    </CollectionProvider>
  );
}

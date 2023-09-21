import React, { useRef, useMemo, useContext } from 'react';
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
import { useFlowContext } from '../../FlowContext';
import { parse } from '@nocobase/utils/client';

function useFlowContextData(dataSource) {
  const { execution } = useFlowContext();
  const data = useMemo(
    () => ({
      $context: execution?.context,
      $jobsMapByNodeId: (execution?.jobs ?? []).reduce(
        (map, job) => Object.assign(map, { [job.nodeId]: job.result }),
        {},
      ),
    }),
    [execution],
  );

  const result = useMemo(() => parse(dataSource)(data), [execution]);
  return result;
}

export function DetailsBlockProvider(props) {
  const field = useField();
  const formBlockRef = useRef(null);
  const { appends, updateAssociationValues } = useAssociationNames();
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

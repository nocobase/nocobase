import React from "react";
import { ResourceActionProvider, useRecord } from "..";

export const ExecutionResourceProvider = ({ request, ...others }) => {
  const workflow = useRecord();
  const props = {
    ...others,
    request: {
      ...request,
      params: {
        ...request?.params,
        filter: {
          ...(request?.params?.filter),
          key: workflow.key
        }
      }
    },
    workflow
  };

  return (
    <ResourceActionProvider {...props} />
  );
}

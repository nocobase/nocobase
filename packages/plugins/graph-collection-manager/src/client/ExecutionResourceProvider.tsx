import React from "react";
import { ResourceActionProvider, useRecord } from "@nocobase/client";

export const ExecutionResourceProvider = ({ request, ...others }) => {
  const graphCollection = useRecord();
  const props = {
    ...others,
    request: {
      ...request,
      params: {
        ...request?.params,
        filter: {
          ...(request?.params?.filter),
          key: graphCollection.key
        }
      }
    },
    graphCollection
  };

  return (
    <ResourceActionProvider {...props} />
  );
}

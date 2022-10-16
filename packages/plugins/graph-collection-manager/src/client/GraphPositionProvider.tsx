import React, { createContext, useContext } from 'react';
import { useAPIClient, useRequest } from '@nocobase/client';
interface CollectionNodeOptions {
  setTargetNode?: Function;
  node?: Node | any;
  record?: Object;
}
export const GraphPositionContext = createContext(null);
export const useGraphPosions = () => {
  return useContext(GraphPositionContext);
};

export const GraphPositionProvider: React.FC<CollectionNodeOptions> = (props: any) => {
  const api = useAPIClient();
  const options = {
    resource: 'graphPositions',
    action: 'list',
  };
  const service = useRequest(options);
  const useSaveGraphPositionAction = async (data) => {
    await api.resource('graphPositions').create({ values: data });
  };
  const useUpdatePositionAction = async (position) => {
    await api.resource('graphPositions').update({
      filter: { collectionName: position.collectionName },
      values: { ...position },
    });
  };
  return (
    <GraphPositionContext.Provider
      value={{
        positions: service?.data?.data,
        refreshPositions: async () => {
          const { data } = await api.request(options);
          service.mutate(data);
        },
        createPositions: useSaveGraphPositionAction,
        updatePosition: useUpdatePositionAction,
      }}
    >
      {props.children}
    </GraphPositionContext.Provider>
  );
};

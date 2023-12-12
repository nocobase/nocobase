import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { IResource } from '@nocobase/sdk';

import { useAPIClient } from '../../api-client';
import { useBlockSettingsV2 } from './BlockSettingsProvider';

export const BlockResourceContextV2 = createContext<IResource>(null);
BlockResourceContextV2.displayName = 'BlockResourceContextV2';

export const BlockResourceProviderV2: FC<{ children?: ReactNode }> = ({ children }) => {
  const { props } = useBlockSettingsV2();
  const { association, collection, sourceId } = props;
  const api = useAPIClient();
  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceId);
    }
    return api.resource(collection);
  }, [api, association, collection, sourceId]);
  return <BlockResourceContextV2.Provider value={resource}>{children}</BlockResourceContextV2.Provider>;
};

export function useBlockResourceV2(showError = true) {
  const context = useContext(BlockResourceContextV2);

  if (showError && !context) {
    throw new Error('useResourceV2() must be used within a RecordProviderV2');
  }

  return context;
}

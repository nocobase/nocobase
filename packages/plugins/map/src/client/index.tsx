import { CollectionManagerContext, CurrentAppInfoProvider, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { interfaces } from './fields';
import { Initialize } from './initialize';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);

  return (
    <CurrentAppInfoProvider>
      <Initialize>
        <SchemaComponentOptions components={{ Map }}>
          <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, ...interfaces } }}>
            {props.children}
          </CollectionManagerContext.Provider>
        </SchemaComponentOptions>
      </Initialize>
    </CurrentAppInfoProvider>
  );
});

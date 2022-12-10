import { CollectionManagerContext, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { interfaces } from './fields';
import './init';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);

  return (
    <SchemaComponentOptions components={{ Map }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, ...interfaces } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

import { CollectionManagerContext, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { lineString, point, polygon } from './fields';
import './init';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ Map }}>
      <CollectionManagerContext.Provider
        value={{ ...ctx, interfaces: { ...ctx.interfaces, point, polygon, lineString } }}
      >
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

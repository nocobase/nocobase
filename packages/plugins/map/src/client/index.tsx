import { CollectionManagerContext, registerField, registerGroupLabel, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { point } from './fields';

registerGroupLabel('map', '{{t("Map")}}');
registerField(point.group, 'point', point);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ Map }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, point } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

import { CollectionManagerContext, registerField, registerGroupLabel, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { point, polygon } from './fields';

registerGroupLabel(point.group, '{{t("Map")}}');
registerField(point.group, point.name.toString(), point);
registerField(polygon.group, polygon.name.toString(), polygon);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ Map }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, point, polygon } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

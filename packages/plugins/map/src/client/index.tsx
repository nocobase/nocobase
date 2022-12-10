import { CollectionManagerContext, registerField, registerGroupLabel, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { linestring, point, polygon } from './fields';

registerGroupLabel(point.group, '{{t("Map")}}');
registerField(point.group, point.name.toString(), point);
registerField(polygon.group, polygon.name.toString(), polygon);
registerField(linestring.group, linestring.name.toString(), linestring);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ Map }}>
      <CollectionManagerContext.Provider
        value={{ ...ctx, interfaces: { ...ctx.interfaces, point, polygon, linestring } }}
      >
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

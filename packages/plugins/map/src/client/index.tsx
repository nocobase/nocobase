import { CollectionManagerContext, registerField, registerGroup, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import Map from './components/Map';
import { linestring, point, polygon } from './fields';

registerGroup(point.group, {
  label: '{{t("Map")}}',
  order: 51,
});
registerField(point.group, point.title, point);
registerField(polygon.group, polygon.title, polygon);
registerField(linestring.group, linestring.title, linestring);

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

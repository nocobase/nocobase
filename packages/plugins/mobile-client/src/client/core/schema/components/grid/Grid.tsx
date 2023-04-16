import { useFieldSchema } from '@formily/react';
import { DndContext, useSchemaInitializer } from '@nocobase/client';
import React from 'react';
import { Grid } from 'antd-mobile';

const GridItem: React.FC = (props) => {
  return (
    <Grid.Item className="nb-mobile-grid-item" span={1} {...props}>
      {props.children}
    </Grid.Item>
  );
};

export const InternalMGrid: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);

  return (
    <DndContext>
      <Grid className="nb-mobile-grid" columns={1} gap={8}>
        {props.children}
        {render()}
      </Grid>
    </DndContext>
  );
};

export const MGrid = InternalMGrid as unknown as typeof InternalMGrid & {
  Item: typeof Grid.Item;
};
MGrid.Item = GridItem;
MGrid.displayName = 'MGrid';

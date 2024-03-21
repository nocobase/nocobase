import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { MapBlock } from './MapBlock';
import { MapBlockDesigner } from './MapBlockDesigner';
import { MapBlockInitializer } from './MapBlockInitializer';
import { MapBlockProvider, useMapBlockProps } from './MapBlockProvider';

export const MapBlockOptions: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{ useMapBlockProps }}
      components={{ MapBlockInitializer, MapBlockDesigner, MapBlockProvider, MapBlock }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

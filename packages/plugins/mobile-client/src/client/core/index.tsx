import { SchemaComponentOptions, SortableContext, SortableItem } from '@nocobase/client';
import React from 'react';
import MobileCenter from './MobileCenter';

export const MobileCore: React.FC = (props) => {
  return <SchemaComponentOptions components={{ MobileCenter }}>{props.children}</SchemaComponentOptions>;
};

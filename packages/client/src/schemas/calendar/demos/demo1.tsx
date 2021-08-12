import { ISchema } from '@formily/react';
import React from 'react';
import { SchemaRenderer } from '../../';
import { Calendar } from '..';
import events from './events';

const schema: ISchema = {
  type: 'array',
  name: 'calendar1',
  'x-component': 'Calendar',
  default: events,
  properties: {
    event: {
      type: 'void',
      'x-component': 'Calendar.Event',
      properties: {
      },
    },
  },
};

export default () => {
  return <SchemaRenderer components={{ Calendar }} schema={schema} />;
};

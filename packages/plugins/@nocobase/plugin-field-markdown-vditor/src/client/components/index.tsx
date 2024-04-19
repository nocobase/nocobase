import { Display } from './Display';
import { Edit } from './Edit';
import { connect, mapProps, mapReadPretty, observer } from '@formily/react';
import React from 'react';

export const MarkdownVditor = connect(
  Edit,
  mapProps((props: any, field) => {
    return {
      ...props,
      ...field,
    };
  }),
  mapReadPretty(Display),
);

export default MarkdownVditor;

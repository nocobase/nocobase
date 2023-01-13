import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CommentBlockInitializer } from './CommentBlockInitializer';
import { CommentBlock } from './CommentBlock';

export default React.memo((props: any) => {
  return (
    <SchemaComponentOptions components={{ CommentBlock, CommentBlockInitializer }}>
      {props.children}
    </SchemaComponentOptions>
  );
});

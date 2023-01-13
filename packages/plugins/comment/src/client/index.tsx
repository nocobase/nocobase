import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CommentBlockInitializer } from './CommetBlock/CommentBlockInitializer';
import { CommentBlock } from './CommetBlock/CommentBlock';
import { useCommetRecordInitializerItem } from './CommetRecord/useCommetRecordInitializerItem';
import { CommetRecordInitializer } from './CommetRecord/CommetRecordInitializer';
import { CommetRecord } from './CommetRecord/CommetRecord';

export default React.memo((props: any) => {
  useCommetRecordInitializerItem();
  return (
    <SchemaComponentOptions
      components={{ CommentBlock, CommentBlockInitializer, CommetRecordInitializer, CommetRecord }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});

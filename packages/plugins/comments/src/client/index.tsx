import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CommentBlockInitializer } from './CommentBlock/CommentBlockInitializer';
import { CommentBlock } from './CommentBlock/CommentBlock';
import { useCommentRecordInitializerItem } from './CommentRecord/useCommentRecordInitializerItem';
import { CommentRecordInitializer } from './CommentRecord/CommentRecordInitializer';
import { CommentRecord } from './CommentRecord/CommentRecord';

export default React.memo((props: any) => {
  useCommentRecordInitializerItem();
  return (
    <SchemaComponentOptions
      components={{
        CommentBlock,
        CommentRecord,
        CommentBlockInitializer,
        CommentRecordInitializer,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});

import { RecordBlockInitializersProvider, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CommentBlockInitializer } from './CommentBlock/CommentBlockInitializer';
import { CommentBlock } from './CommentBlock/CommentBlock';
import { useCommentRecordInitializerItem } from './CommentRecord/useCommentRecordInitializerItem';
import { CommentRecordInitializer } from './CommentRecord/CommentRecordInitializer';
import { CommentRecord } from './CommentRecord/CommentRecord';
import { useCommentTranslation } from './locale';

export default React.memo((props: any) => {
  const { t } = useCommentTranslation();

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
      <RecordBlockInitializersProvider
        extraOtherBlocks={[
          {
            key: 'comments',
            type: 'item',
            title: t('Comment'),
            component: 'CommentBlockInitializer',
          },
        ]}
      >
        {props.children}
      </RecordBlockInitializersProvider>
    </SchemaComponentOptions>
  );
});

import { RecordBlockInitializersProvider, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CommentBlockInitializer } from './CommentBlock/CommentBlockInitializer';
import { CommentBlock } from './CommentBlock/CommentBlock';
import { useCommentRecordInitializerItem } from './CommentRecord/useCommentRecordInitializerItem';
import { CommentRecordInitializer } from './CommentRecord/CommentRecordInitializer';
import { useCommentTranslation } from './locale';

import { CommentRecordBlockProvider } from './CommentRecord/CommentRecordBlockProvider';
import { CommentRecordBlockInitializer } from './CommentRecord/CommentRecordBlockInitializer';
import { CommentRecordTableActionColumnInitializer } from './CommentRecord/components/CommentRecordTableActionColumnInitializer';
import { CommentRecordViewActionInitializer } from './CommentRecord/components/CommentRecordViewActionInitializer';
import { CommentRecordContent } from './CommentRecord/components/CommentRecordContent';

export default React.memo((props: any) => {
  const { t } = useCommentTranslation();

  useCommentRecordInitializerItem();

  return (
    <SchemaComponentOptions
      components={{
        CommentBlock,
        CommentBlockInitializer,
        CommentRecordInitializer,
        CommentRecordBlockProvider,
        CommentRecordBlockInitializer,
        CommentRecordTableActionColumnInitializer,
        CommentRecordViewActionInitializer,
        CommentRecordContent,
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

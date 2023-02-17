import { RecordBlockInitializersProvider, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { ArrayTable } from '@formily/antd';
import { CommentBlockInitializer } from './CommentBlock/CommentBlockInitializer';
import { CommentBlock } from './CommentBlock/CommentBlock';
import { useCommentRecordInitializerItem } from './CommentRecord/useCommentRecordInitializerItem';
import { CommentRecordInitializer } from './CommentRecord/CommentRecordInitializer';
import { CommentContent, Commenter, Field, PlainText, Username, Value } from './CommentRecord/CommentRecord';
import { useCommentTranslation } from './locale';
import { CommentRecordDesigner } from './CommentRecord/CommentRecord.Designer';
import { CommentRecordDecorator } from './CommentRecord/CommentRecord.Decorator';

export default React.memo((props: any) => {
  const { t } = useCommentTranslation();

  useCommentRecordInitializerItem();

  return (
    <SchemaComponentOptions
      components={{
        CommentBlock,
        CommentRecordDesigner,
        CommentRecordDecorator,
        CommentBlockInitializer,
        CommentRecordInitializer,
        ArrayTable,
        Username,
        Field,
        Value,
        Commenter,
        PlainText,
        CommentContent,
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

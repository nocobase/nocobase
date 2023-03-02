import React from 'react';
import { observer } from '@formily/react';
import { useRecord, ReadPretty } from '@nocobase/client';
import { getContent, CommentItem } from '../../CommentBlock/CommentBlock';

export const CommentRecordContent = observer(() => {
  const record = useRecord();
  const content = getContent(record as CommentItem);

  return (
    <ReadPretty.Html
      ellipsis
      forceHtmlEllipsis
      value={content}
      htmlStyle={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
    />
  );
});

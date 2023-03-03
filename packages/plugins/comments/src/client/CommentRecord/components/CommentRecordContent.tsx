import React from 'react';
import { observer } from '@formily/react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { useRecord, ReadPretty } from '@nocobase/client';

export const InnerCommentRecordContent = observer(() => {
  const record = useRecord();
  return (
    <ReadPretty.Html
      ellipsis
      forceHtmlEllipsis
      value={record.content}
      htmlStyle={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
    />
  );
});

export const CommentRecordContent = connect(
  AntdInput,
  mapProps((props, field) => props),
  mapReadPretty(InnerCommentRecordContent),
);

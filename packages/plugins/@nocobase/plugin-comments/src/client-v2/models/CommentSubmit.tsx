/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModel, type MultiRecordResource, observer } from '@nocobase/flow-engine';
import { App, Button, Input } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import { getErrorMessage } from './utils';

type MarkdownEditor = {
  edit: (props: Record<string, unknown>) => React.ReactNode;
};

type CommentSubmitProps = {
  createAble?: boolean;
  defaultValue?: string;
};

type CommentModel = ReturnType<typeof useFlowModel> & {
  collection?: {
    getFields: () => { name: string; uiSchema?: Record<string, unknown> }[];
  };
  context: {
    markdown?: MarkdownEditor;
  };
  resource: MultiRecordResource;
};

export const CommentSubmit = observer((props: CommentSubmitProps) => {
  const { createAble = true, defaultValue = '' } = props;
  const model = useFlowModel() as CommentModel;
  const markdown = model.context.markdown;
  const resource = model.resource;
  const t = useT();
  const { message } = App.useApp();
  const [content, setContent] = useState(defaultValue);

  useEffect(() => {
    setContent(defaultValue);
  }, [defaultValue]);

  const canSubmit = useMemo(() => content.trim().length > 0, [content]);

  const contentFieldComponentProps = useMemo(() => {
    return model.collection?.getFields().find((field) => field.name === 'content')?.uiSchema?.['x-component-props'];
  }, [model.collection]);

  const submit = useCallback(async () => {
    try {
      await resource.create({
        content,
      });

      setContent('');
      const total = resource.getMeta('count') || 0;
      const pageSize = resource.getPageSize() || 10;
      resource.setPage(Math.max(Math.ceil((total + 1) / pageSize), 1));
      await resource.refresh();
    } catch (error) {
      message.error(getErrorMessage(error, t('Failed to create comment')));
    }
  }, [content, message, resource, t]);

  if (!createAble) {
    return null;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {markdown?.edit ? (
        markdown.edit({
          ...(typeof contentFieldComponentProps === 'object' ? contentFieldComponentProps : {}),
          value: content,
          quoteFlag: true,
          onChange: (value: string) => {
            setContent(value);
          },
          enableContextSelect: false,
        })
      ) : (
        <Input.TextArea value={content} onChange={(event) => setContent(event.target.value)} autoSize />
      )}
      <Button disabled={!canSubmit} onClick={submit} type="primary" style={{ marginTop: 10 }}>
        {t('Comment')}
      </Button>
    </div>
  );
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, type MultiRecordResource } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { App, Button, Card, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useT } from '../locale';
import { CommentActions } from './CommentActions';
import { getErrorMessage } from './utils';

type CommentRecord = {
  id: string | number;
  content?: string;
  createdAt?: string;
  createdBy?: {
    nickname?: string;
  };
};

type MarkdownRuntime = {
  edit: (props: Record<string, unknown>) => React.ReactNode;
  render: (value: string, options: Record<string, unknown>) => React.ReactNode;
};

type LiquidRuntime = {
  renderWithFullContext: (value: string, context: unknown) => Promise<string>;
};

type CommentItemProps = {
  value: CommentRecord;
  resource: MultiRecordResource;
  model: {
    context: {
      markdown?: MarkdownRuntime;
      liquid?: LiquidRuntime;
      defineMethod: (name: string, method: (...args: unknown[]) => unknown) => void;
    };
  };
};

const itemContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const timelineStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  content: '',
  display: 'block',
  width: 2,
  left: 16,
  backgroundColor: '#d0d7deb3',
  zIndex: 0,
};

const titleStyle: React.CSSProperties = {
  color: '#636c76',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 16,
  borderRadius: '8px 8px 0 0',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  lineHeight: '42px',
};

const titleLeftStyle: React.CSSProperties = {
  backgroundColor: '#f6f8fa',
  color: '#636c76',
  display: 'flex',
  alignItems: 'center',
  columnGap: 6,
};

const titleRightStyle: React.CSSProperties = {
  marginRight: 16,
  flexShrink: 0,
};

const editorStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  backgroundColor: 'white',
  borderRadius: '0 0 8px 8px',
};

const editorButtonAreaStyle: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  columnGap: 5,
};

const Display = ({
  value,
  markdown,
  liquid,
  translate,
  context,
}: {
  value?: string;
  markdown?: MarkdownRuntime;
  liquid?: LiquidRuntime;
  translate: (key: string) => string;
  context: unknown;
}) => {
  const [content, setContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    let active = true;

    async function renderContent() {
      if (!value) {
        setContent(null);
        return;
      }

      try {
        const result = liquid ? await liquid.renderWithFullContext(value, context) : value;
        const rendered = markdown?.render
          ? markdown.render(translate(result), { ellipsis: false, textOnly: false })
          : result;
        if (active) {
          setContent(rendered);
        }
      } catch (error) {
        if (active) {
          setContent(<pre style={{ color: 'red' }}>{getErrorMessage(error, translate('Render error'))}</pre>);
        }
      }
    }

    renderContent();

    return () => {
      active = false;
    };
  }, [context, liquid, markdown, translate, value]);

  return <>{content}</>;
};

export const CommentItem = observer((props: CommentItemProps) => {
  const { value, resource, model } = props;
  const t = useT();
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  const [updateValue, setUpdateValue] = useState(value?.content || '');
  const markdown = model.context.markdown;

  useEffect(() => {
    setUpdateValue(value?.content || '');
  }, [value?.content]);

  model.context.defineMethod('setEditing', () => {
    setEditing(true);
  });

  const saveComment = useCallback(async () => {
    try {
      await resource.update(value.id, {
        content: updateValue,
      });

      await resource.refresh();
    } catch (error) {
      message.error(getErrorMessage(error, t('Failed to update comment')));
    }
  }, [message, resource, t, updateValue, value.id]);

  return (
    <div key={value.id}>
      <div style={itemContainerStyle}>
        <div style={timelineStyle} />
        <Card
          size="small"
          styles={{
            header: {
              padding: 0,
              fontWeight: 'normal',
              backgroundColor: '#f6f8fa',
            },
          }}
          title={
            <div style={titleStyle}>
              <div style={titleLeftStyle}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{value?.createdBy?.nickname}</span>
                <span style={{ fontSize: 14 }}>{t('commented')}</span>
                <Tooltip title={dayjs(value?.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                  <span style={{ fontSize: 14 }}>{dayjs(value?.createdAt).fromNow()}</span>
                </Tooltip>
              </div>
              <div style={titleRightStyle}>
                <CommentActions />
              </div>
            </div>
          }
        >
          <div style={editorStyle}>
            {editing && markdown?.edit ? (
              markdown.edit({
                value: updateValue,
                onChange: (nextValue: string) => {
                  setUpdateValue(nextValue);
                },
                enableContextSelect: false,
              })
            ) : (
              <Display
                value={value?.content}
                markdown={model.context.markdown}
                liquid={model.context.liquid}
                translate={t}
                context={model.context}
              />
            )}
            {editing && (
              <div style={editorButtonAreaStyle}>
                <Button
                  type="primary"
                  onClick={() => {
                    setEditing(false);
                    saveComment();
                  }}
                >
                  {t('Update Comment')}
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
});

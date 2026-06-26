/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  observer,
  type FlowModel,
  type MultiRecordResource,
} from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { App, Button, Card, Empty, Input, List, Space, Tooltip } from 'antd';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useT } from '../../locale';
import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import { getErrorMessage } from '../utils/errors';
import { getCollectionField, getDisplayValue, getRecordPrimaryKeyValue, type RecordCommentRecord } from '../utils';
import { RecordCommentActions } from './RecordCommentActions';

type MarkdownRuntime = {
  edit: (props: Record<string, unknown>) => React.ReactNode;
  render: (value: string, options: Record<string, unknown>) => React.ReactNode;
};

type LiquidRuntime = {
  renderWithFullContext: (value: string, context: unknown) => Promise<string>;
};

type RecordCommentContext = {
  markdown?: MarkdownRuntime;
  liquid?: LiquidRuntime;
  user?: {
    id?: string | number;
    nickname?: string;
    username?: string;
    name?: string;
  };
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const cardTitleStyle: React.CSSProperties = {
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

const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  backgroundColor: 'white',
  borderRadius: '0 0 8px 8px',
  minHeight: 24,
};

const editorButtonAreaStyle: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  columnGap: 5,
};

const itemContainerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
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

const titleRightStyle: React.CSSProperties = {
  marginRight: 16,
  flexShrink: 0,
};

const submitButtonAreaStyle: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  columnGap: 8,
  flexWrap: 'wrap',
};

const normalizeForkKeyPart = (value: unknown) => {
  const result = String(value ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_');
  return result || 'fork';
};

type FlowModelWithForkId = FlowModel & {
  forkId?: string | number;
};

const getFlowModelRenderKey = (model: FlowModel, fallback: string) => {
  const forkId = (model as FlowModelWithForkId).forkId;
  return `${model.uid}:${forkId ?? fallback}`;
};

const getMarkdownProps = (model: RecordCommentsBlockModel) => {
  const contentField = getCollectionField(model.collection, model.mapping.contentField);
  const props = contentField?.uiSchema?.['x-component-props'];
  return props && typeof props === 'object' ? props : {};
};

const getCurrentUserId = (model: RecordCommentsBlockModel) => {
  const context = model.context as RecordCommentContext;
  return context.user?.id;
};

const getCommenterCreatePayload = (model: RecordCommentsBlockModel) => {
  const commenterField = model.mapping.commenterField;
  const commenterCollectionField = getCollectionField(model.collection, commenterField);
  const currentUserId = getCurrentUserId(model);

  if (!commenterField || commenterCollectionField?.interface === 'createdBy' || currentUserId === undefined) {
    return {};
  }

  return {
    [commenterField]: currentUserId,
  };
};

const getCommenterDisplayName = (
  record: RecordCommentRecord,
  mapping: RecordCommentsBlockModel['mapping'],
  fallback: string,
) => {
  if (!mapping.commenterField) {
    return fallback;
  }

  return getDisplayValue(record[mapping.commenterField]);
};

const DisplayContent = observer(({ value, model }: { value: unknown; model: RecordCommentsBlockModel }) => {
  const t = useT();
  const [content, setContent] = useState<React.ReactNode>(null);
  const context = model.context as RecordCommentContext;
  const translateRef = useRef(t);
  translateRef.current = t;

  useEffect(() => {
    let active = true;

    async function renderContent() {
      if (value === null || value === undefined || value === '') {
        setContent(null);
        return;
      }

      try {
        const rawValue = String(value);
        const liquidValue = context.liquid
          ? await context.liquid.renderWithFullContext(rawValue, model.context)
          : rawValue;
        const rendered = context.markdown?.render
          ? context.markdown.render(translateRef.current(liquidValue), { ellipsis: false, textOnly: false })
          : liquidValue;
        if (active) {
          setContent(rendered);
        }
      } catch (error) {
        if (active) {
          setContent(
            <pre style={{ color: 'red' }}>{getErrorMessage(error, translateRef.current('Render error'))}</pre>,
          );
        }
      }
    }

    renderContent().catch((error) => {
      if (active) {
        setContent(<pre style={{ color: 'red' }}>{getErrorMessage(error, translateRef.current('Render error'))}</pre>);
      }
    });

    return () => {
      active = false;
    };
  }, [context.liquid, context.markdown, model, value]);

  return <>{content}</>;
});

const SubmitBox = observer(({ model, forkKeyPrefix }: { model: RecordCommentsBlockModel; forkKeyPrefix: string }) => {
  const t = useT();
  const { message } = App.useApp();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const context = model.context as RecordCommentContext;
  const mapping = model.mapping;
  const canSubmit = useMemo(() => content.trim().length > 0, [content]);

  model.context.defineMethod('setQuoteContent', (value: string) => {
    setContent(value);
  });

  const submit = useCallback(async () => {
    if (!mapping.contentField || !mapping.ownerField || model.ownerValue === undefined) {
      return;
    }

    setSubmitting(true);
    try {
      await model.resource.create({
        [mapping.contentField]: content,
        [mapping.ownerField]: model.ownerValue,
        ...getCommenterCreatePayload(model),
      } as RecordCommentRecord);
      setContent('');
      const count = model.resource.getCount() || 0;
      const pageSize = model.resource.getPageSize() || 10;
      model.resource.setPage(Math.max(Math.ceil((count + 1) / pageSize), 1));
      await model.resource.refresh();
    } catch (error) {
      message.error(getErrorMessage(error, t('Failed to create comment')));
    } finally {
      setSubmitting(false);
    }
  }, [content, mapping.contentField, mapping.ownerField, message, model, t]);

  return (
    <div style={{ marginTop: 10 }}>
      {context.markdown?.edit ? (
        context.markdown.edit({
          ...getMarkdownProps(model),
          value: content,
          quoteFlag: true,
          onChange: (value: string) => {
            setContent(value);
          },
          enableContextSelect: false,
        })
      ) : (
        <Input.TextArea
          aria-label={t('Comment content')}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          autoSize
        />
      )}
      <div style={submitButtonAreaStyle}>
        <Button disabled={!canSubmit} loading={submitting} onClick={submit} type="primary">
          {t('Comment')}
        </Button>
        <RecordCommentSubmitActions
          model={model}
          content={content}
          setContent={setContent}
          submit={submit}
          forkKeyPrefix={forkKeyPrefix}
        />
      </div>
    </div>
  );
});

const RecordCommentSubmitActions = observer(
  ({
    model,
    content,
    setContent,
    submit,
    forkKeyPrefix,
  }: {
    model: RecordCommentsBlockModel;
    content: string;
    setContent: (value: string) => void;
    submit: () => Promise<void>;
    forkKeyPrefix: string;
  }) => {
    return (
      <DndProvider>
        <Space size={0} style={{ gap: 0 }}>
          {model.mapSubModels('submitActions', (action, index) => {
            const fork = action.createFork({}, `${forkKeyPrefix}_submit_${normalizeForkKeyPart(action.uid)}_${index}`);
            fork.context.defineProperty('resource', {
              get: () => model.resource,
            });
            fork.context.defineProperty('collection', {
              get: () => model.collection,
            });
            fork.context.defineProperty('blockModel', {
              get: () => model,
            });
            fork.context.defineProperty('commentContent', {
              get: () => content,
              cache: false,
            });
            fork.context.defineMethod('setCommentContent', setContent);
            fork.context.defineMethod('submitComment', submit);
            return (
              <Droppable model={fork} key={getFlowModelRenderKey(fork, `${forkKeyPrefix}_submit_${index}`)}>
                <FlowModelRenderer
                  model={fork}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            );
          })}

          {model.context.flowSettingsEnabled ? (
            <AddSubModelButton
              key="record-comment-submit-actions-add"
              model={model}
              subModelKey="submitActions"
              subModelBaseClasses={['RecordCommentSubmitActionGroupModel']}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          ) : null}
        </Space>
      </DndProvider>
    );
  },
);

const RecordCommentItemView = observer(
  ({
    blockModel,
    itemModel,
    record,
    forkKeyPrefix,
  }: {
    blockModel: RecordCommentsBlockModel;
    itemModel: FlowModel;
    record: RecordCommentRecord;
    forkKeyPrefix: string;
  }) => {
    const t = useT();
    const { message } = App.useApp();
    const context = blockModel.context as RecordCommentContext;
    const mapping = blockModel.mapping;
    const contentValue = String(record[mapping.contentField || ''] || '');
    const [editing, setEditing] = useState(false);
    const [updateValue, setUpdateValue] = useState(contentValue);
    const [saving, setSaving] = useState(false);
    const title = getCommenterDisplayName(record, mapping, t('Comment'));
    const dateValue = mapping.dateField ? record[mapping.dateField] : undefined;
    const recordKey = getRecordPrimaryKeyValue(record, blockModel.collection);

    useEffect(() => {
      setUpdateValue(contentValue);
    }, [contentValue]);

    const cancelEditing = useCallback(() => {
      setUpdateValue(contentValue);
      setEditing(false);
    }, [contentValue]);

    const saveComment = useCallback(async () => {
      if (!recordKey || !mapping.contentField) {
        return;
      }

      setSaving(true);
      try {
        await blockModel.resource.update(recordKey, {
          [mapping.contentField]: updateValue,
        });
        setEditing(false);
      } catch (error) {
        message.error(getErrorMessage(error, t('Failed to update comment')));
      } finally {
        setSaving(false);
      }
    }, [blockModel.resource, mapping.contentField, message, recordKey, t, updateValue]);

    return (
      <div style={itemContainerStyle}>
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
            <div style={cardTitleStyle}>
              <div style={titleLeftStyle}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{title}</span>
                {dateValue ? (
                  <Tooltip title={dayjs(dateValue as string).format('YYYY-MM-DD HH:mm:ss')}>
                    <span style={{ fontSize: 14 }}>{dayjs(dateValue as string).fromNow()}</span>
                  </Tooltip>
                ) : null}
              </div>
              <div style={titleRightStyle}>
                <RecordCommentActions
                  blockModel={blockModel}
                  record={record}
                  itemModel={itemModel}
                  forkKeyPrefix={forkKeyPrefix}
                  setEditing={() => {
                    setEditing(true);
                  }}
                />
              </div>
            </div>
          }
        >
          <div style={contentStyle}>
            {editing && context.markdown?.edit ? (
              context.markdown.edit({
                ...getMarkdownProps(blockModel),
                value: updateValue,
                onChange: (value: string) => {
                  setUpdateValue(value);
                },
                enableContextSelect: false,
              })
            ) : editing ? (
              <Input.TextArea
                aria-label={t('Comment content')}
                value={updateValue}
                onChange={(event) => setUpdateValue(event.target.value)}
                autoSize
              />
            ) : (
              <DisplayContent value={record[mapping.contentField || '']} model={blockModel} />
            )}
            {editing ? (
              <div style={editorButtonAreaStyle}>
                <Button type="primary" loading={saving} onClick={saveComment}>
                  {t('Update Comment')}
                </Button>
                <Button onClick={cancelEditing}>{t('Cancel')}</Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  },
);

export const RecordCommentsBlockView = Object.assign(
  observer(
    ({
      model,
      dataSource,
      onPageChange,
    }: {
      model: RecordCommentsBlockModel;
      dataSource: RecordCommentRecord[];
      onPageChange: (page: number) => void;
    }) => {
      const t = useT();
      const resource = model.resource as MultiRecordResource<RecordCommentRecord>;
      const page = resource.getPage() || 1;
      const pageSize = resource.getPageSize() || 20;
      const count = resource.getCount() || 0;
      const renderInstanceKey = normalizeForkKeyPart(useId());
      const blockForkKeyPrefix = `${normalizeForkKeyPart(model.uid)}_${renderInstanceKey}`;

      useEffect(() => {
        void model.ensureLastPageLoaded();
      }, [count, model, page, pageSize, resource.loading]);

      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <List
            pagination={
              count > 0
                ? {
                    current: page,
                    pageSize,
                    total: count,
                    onChange: onPageChange,
                    showSizeChanger: false,
                    size: 'small',
                  }
                : false
            }
          >
            <div style={listStyle}>
              {dataSource.length ? (
                dataSource.map((record, index) => {
                  const isFirst = index === 0;
                  const isLast = index === dataSource.length - 1;
                  const recordForkKey = normalizeForkKeyPart(
                    getRecordPrimaryKeyValue(record, model.collection) || index,
                  );
                  const itemModel = model.subModels.items[0].createFork(
                    {},
                    `${blockForkKeyPrefix}_item_${recordForkKey}`,
                  );
                  itemModel.context.defineProperty('record', {
                    get: () => record,
                  });
                  itemModel.context.defineProperty('blockModel', {
                    get: () => model,
                  });
                  return (
                    <div
                      key={getFlowModelRenderKey(itemModel, `${blockForkKeyPrefix}_item_${recordForkKey}`)}
                      style={{
                        position: 'relative',
                        padding: `${isFirst ? 0 : '10px'} 0 ${isLast ? 0 : '10px'} 0`,
                      }}
                    >
                      <div style={timelineStyle} />
                      <RecordCommentItemView
                        blockModel={model}
                        itemModel={itemModel}
                        record={record}
                        forkKeyPrefix={`${blockForkKeyPrefix}_item_${recordForkKey}`}
                      />
                    </div>
                  );
                })
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No comments')} />
              )}
            </div>
          </List>
          <SubmitBox model={model} forkKeyPrefix={blockForkKeyPrefix} />
        </Space>
      );
    },
  ),
  {
    Item: RecordCommentItemView,
  },
);

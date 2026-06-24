/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Form, Select } from 'antd';
import { WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../../../../locale';
import { WorkflowListCollapse } from '../../../components/WorkflowListCollapse';
import type { LLMMessage, LLMMessageContent, LLMMessageContentType, LLMMessageRole } from '../../../types';

const defaultUserContent: LLMMessageContent = {
  type: 'text',
};

const defaultMessage: LLMMessage = {
  role: 'user',
  content: [defaultUserContent],
};

function cloneDefaultMessage(): LLMMessage {
  return {
    role: 'user',
    content: [{ type: 'text' }],
  };
}

function toMessages(value?: LLMMessage[]) {
  return Array.isArray(value) ? value : [];
}

function toContent(value?: string | LLMMessageContent[]) {
  return Array.isArray(value) ? value : [];
}

function getImageUrl(item: LLMMessageContent) {
  const imageUrl = item.image_url;
  if (typeof imageUrl === 'string') {
    return imageUrl;
  }
  if (imageUrl && typeof imageUrl === 'object' && !Array.isArray(imageUrl)) {
    return typeof imageUrl.url === 'string' ? imageUrl.url : undefined;
  }
  return undefined;
}

export function Messages() {
  const t = useT();
  const form = Form.useFormInstance();
  const watchedMessages = Form.useWatch(['config', 'messages'], form);
  const messages = toMessages(watchedMessages ?? form.getFieldValue(['config', 'messages']));

  const updateMessages = useCallback(
    (next: LLMMessage[]) => {
      form.setFieldValue(['config', 'messages'], next);
    },
    [form],
  );

  const updateMessage = useCallback(
    (index: number, patch: Partial<LLMMessage>) => {
      updateMessages(messages.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    },
    [messages, updateMessages],
  );

  const updateContent = useCallback(
    (messageIndex: number, nextContent: LLMMessageContent[]) => {
      updateMessage(messageIndex, { content: nextContent });
    },
    [updateMessage],
  );

  const updateContentItem = useCallback(
    (messageIndex: number, contentIndex: number, patch: Partial<LLMMessageContent>) => {
      const currentContent = toContent(messages[messageIndex]?.content);
      updateContent(
        messageIndex,
        currentContent.map((item, itemIndex) => (itemIndex === contentIndex ? { ...item, ...patch } : item)),
      );
    },
    [messages, updateContent],
  );

  return (
    <WorkflowListCollapse<LLMMessage>
      value={messages}
      onChange={updateMessages}
      getDefaultValue={cloneDefaultMessage}
      defaultValue={defaultMessage}
      addText={t('Add prompt')}
      itemTitle={t('Message')}
      renderHeader={(_, index) => t('Message') || `${index + 1}`}
      renderItem={(message, messageIndex) => {
        const role = message.role ?? 'user';
        return (
          <>
            <Form.Item label={t('Role')} required>
              <Select<LLMMessageRole>
                value={role}
                options={[
                  { label: 'System', value: 'system' },
                  { label: 'User', value: 'user' },
                  { label: 'Assistant', value: 'assistant' },
                ]}
                onChange={(nextRole) => {
                  updateMessage(messageIndex, {
                    role: nextRole,
                    ...(nextRole === 'user'
                      ? {
                          content: toContent(message.content).length
                            ? toContent(message.content)
                            : [defaultUserContent],
                        }
                      : { message: message.message ?? '', content: message.content }),
                  });
                }}
              />
            </Form.Item>
            {role === 'user' ? (
              <WorkflowListCollapse<LLMMessageContent>
                value={toContent(message.content)}
                onChange={(nextContent) => updateContent(messageIndex, nextContent)}
                defaultValue={defaultUserContent}
                getDefaultValue={() => ({ type: 'text' })}
                addText={t('Add content')}
                itemTitle={t('Content')}
                bordered={false}
                renderHeader={() => t('Content')}
                renderItem={(contentItem, contentIndex) => {
                  const type = contentItem.type ?? 'text';
                  return (
                    <>
                      <Form.Item label={t('Type')} required>
                        <Select<LLMMessageContentType>
                          value={type}
                          options={[
                            { label: t('Text'), value: 'text' },
                            { label: t('Image (send via URL)'), value: 'image_url' },
                            { label: t('Image (send via Base64)'), value: 'image_base64' },
                          ]}
                          onChange={(nextType) => {
                            updateContentItem(messageIndex, contentIndex, {
                              type: nextType,
                              content: nextType === 'text' ? contentItem.content : undefined,
                              image_url: nextType === 'text' ? undefined : contentItem.image_url,
                            });
                          }}
                        />
                      </Form.Item>
                      {type === 'text' ? (
                        <Form.Item label={t('Content')}>
                          <WorkflowVariableTextArea
                            value={contentItem.content}
                            autoSize={{ minRows: 5 }}
                            onChange={(content) => updateContentItem(messageIndex, contentIndex, { content })}
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item label={t('Image')} required>
                          <WorkflowVariableInput
                            value={getImageUrl(contentItem)}
                            onChange={(url) =>
                              updateContentItem(messageIndex, contentIndex, {
                                image_url: { url },
                              })
                            }
                          />
                        </Form.Item>
                      )}
                    </>
                  );
                }}
              />
            ) : (
              <Form.Item label={t('Content')}>
                <WorkflowVariableTextArea
                  value={message.message}
                  onChange={(nextMessage) => updateMessage(messageIndex, { message: nextMessage })}
                />
              </Form.Item>
            )}
          </>
        );
      }}
    />
  );
}

export default Messages;

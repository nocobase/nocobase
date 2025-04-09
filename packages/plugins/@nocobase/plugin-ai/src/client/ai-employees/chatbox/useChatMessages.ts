/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '@nocobase/client';
import { useState } from 'react';
import { Action, AttachmentProps, Message, SendOptions } from '../types';
import { uid } from '@formily/shared';
import { useT } from '../../locale';

export const useChatMessages = () => {
  const t = useT();
  const api = useAPIClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [responseLoading, setResponseLoading] = useState(false);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const addMessages = (newMessages: Message[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
  };

  const updateLastMessage = (updater: (message: Message) => Message) => {
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex < 0) {
        return prev;
      }

      const updated = [...prev];
      updated[lastIndex] = updater(updated[lastIndex]);
      return updated;
    });
  };

  const processStreamResponse = async (stream: any) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let error = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let content = '';
      const { done, value } = await reader.read();
      if (done || error) {
        setResponseLoading(false);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          if (data.body) {
            content += data.body;
          }
          if (data.type === 'error') {
            error = true;
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
      }

      result += content;

      // Update the last message with the new content
      updateLastMessage((last) => {
        // @ts-ignore
        last.content.content = last.content.content + content;
        last.loading = false;
        return last;
      });
    }

    if (error) {
      updateLastMessage((last) => {
        last.role = 'error';
        last.loading = false;
        // @ts-ignore
        last.content.content = t(result);
        return last;
      });
    }

    return { result, error };
  };

  const sendMessages = async ({
    sessionId,
    aiEmployee,
    messages: sendMsgs,
    infoFormValues,
    onConversationCreate,
  }: SendOptions & {
    onConversationCreate?: (sessionId: string) => void;
  }) => {
    const msgs: Message[] = [];
    if (!sendMsgs.length) {
      return;
    }
    if (infoFormValues) {
      msgs.push({
        key: uid(),
        role: 'info',
        content: {
          type: 'info',
          content: infoFormValues,
        },
      });
    }
    msgs.push(...sendMsgs.map((msg) => ({ key: uid(), role: 'user', content: msg })));
    addMessages(msgs);
    if (!sessionId) {
      const createRes = await api.resource('aiConversations').create({
        values: {
          aiEmployees: [aiEmployee],
        },
      });
      const conversation = createRes?.data?.data;
      if (!conversation) {
        return;
      }
      sessionId = conversation.sessionId;
      onConversationCreate?.(sessionId);
    }
    setResponseLoading(true);

    addMessage({
      key: uid(),
      role: aiEmployee.username,
      content: {
        type: 'text',
        content: '',
      },
      loading: true,
    });
    const sendRes = await api.request({
      url: 'aiConversations:sendMessages',
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
      data: {
        aiEmployee: aiEmployee.username,
        sessionId,
        messages: msgs,
      },
      responseType: 'stream',
      adapter: 'fetch',
    });
    if (!sendRes?.data) {
      setResponseLoading(false);
      return;
    }
    const { result, error } = await processStreamResponse(sendRes.data);
    // if (actions.length && !error) {
    //   addMessages(
    //     actions.map((action) => ({
    //       key: uid(),
    //       role: 'action',
    //       content: {
    //         type: 'action',
    //         icon: action.icon,
    //         content: action.content,
    //         onClick: () => {
    //           action.onClick(result);
    //         },
    //       },
    //     })),
    //   );
    //   setActions([]);
    // }
  };

  return {
    messages,
    addMessage,
    addMessages,
    setMessages,
    responseLoading,
    sendMessages,
  };
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { Avatar, Tag, Popover, Divider, Button } from 'antd';
import { avatars } from '../avatars';
import {
  SortableItem,
  useBlockContext,
  useLocalVariables,
  useSchemaToolbarRender,
  useToken,
  useVariables,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { useT } from '../../locale';
import { css } from '@emotion/css';
import { useAIEmployeeChatContext } from '../AIEmployeeChatProvider';
import { ChatBoxContext } from '../chatbox/ChatBoxContext';
import { AIEmployee } from '../types';

async function replaceVariables(template, variables, localVariables = {}) {
  const regex = /\{\{\s*(.*?)\s*\}\}/g;
  let result = template;

  const matches = [...template.matchAll(regex)];

  if (matches.length === 0) {
    return template;
  }

  for (const match of matches) {
    const fullMatch = match[0];

    try {
      let value = await variables?.parseVariable(fullMatch, localVariables).then(({ value }) => value);

      if (typeof value !== 'string') {
        try {
          value = JSON.stringify(value);
        } catch (error) {
          console.error(error);
        }
      }

      if (value) {
        result = result.replace(fullMatch, value);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return result;
}

export const AIEmployeeButton: React.FC<{
  aiEmployee: AIEmployee;
  taskDesc?: string;
  attachments: string[];
  actions: string[];
}> = withDynamicSchemaProps(({ aiEmployee, taskDesc, attachments: selectedAttachments, actions: selectedActions }) => {
  const t = useT();
  const { setOpen, send, setAttachments, setFilterEmployee, setActions, clear } = useContext(ChatBoxContext);
  const { token } = useToken();
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaToolbarRender(fieldSchema);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { attachments, actions } = useAIEmployeeChatContext();

  return (
    <SortableItem
      style={{
        position: 'relative',
      }}
      onClick={async () => {
        clear();
        setOpen(true);
        setFilterEmployee(aiEmployee.username);
        if (selectedAttachments && selectedAttachments.length) {
          setAttachments((prev) => {
            const newAttachments = selectedAttachments.map((name: string) => {
              const attachment = attachments[name];
              return {
                type: attachment.type,
                title: attachment.title,
                content: attachment.content,
              };
            });
            return [...prev, ...newAttachments];
          });
        }
        if (selectedActions && selectedActions.length) {
          setActions((prev) => {
            const newActions = selectedActions.map((name: string) => {
              const action = actions[name];
              return {
                icon: action.icon,
                content: action.title,
                onClick: action.action,
              };
            });
            return [...prev, ...newActions];
          });
        }
        const messages = [];
        const message = fieldSchema['x-component-props']?.message;
        if (message) {
          const content = await replaceVariables(message.content, variables, localVariables);
          messages.push({
            type: message.type || 'text',
            content,
          });
        }
        send({
          aiEmployee,
          messages,
          greeting: true,
        });
      }}
    >
      <Popover
        content={
          <div
            style={{
              width: '300px',
              padding: '8px',
            }}
          >
            <div
              style={{
                width: '100%',
                textAlign: 'center',
              }}
            >
              <Avatar
                src={avatars(aiEmployee.avatar)}
                size={60}
                className={css``}
                style={{
                  boxShadow: `0px 0px 2px ${token.colorBorder}`,
                }}
              />
              <div
                style={{
                  fontSize: token.fontSizeLG,
                  fontWeight: token.fontWeightStrong,
                  margin: '8px 0',
                }}
              >
                {aiEmployee.nickname}
              </div>
            </div>
            <Divider
              orientation="left"
              plain
              style={{
                fontStyle: 'italic',
              }}
            >
              {t('Bio')}
            </Divider>
            <p>{aiEmployee.bio}</p>
            {taskDesc && (
              <>
                <Divider
                  orientation="left"
                  plain
                  style={{
                    fontStyle: 'italic',
                  }}
                >
                  {t('Task description')}
                </Divider>
                <p>{taskDesc}</p>
              </>
            )}
          </div>
        }
      >
        <Button
          shape="circle"
          style={{
            width: '40px',
            height: '40px',
          }}
        >
          <Avatar src={avatars(aiEmployee.avatar)} size={40} />
        </Button>
      </Popover>
      {render()}
    </SortableItem>
  );
});

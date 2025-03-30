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
import { ChatBoxContext } from '../chatbox/ChatBoxProvider';
import { AIEmployee } from '../AIEmployeesProvider';
import {
  SortableItem,
  useBlockContext,
  useLocalVariables,
  useSchemaToolbarRender,
  useToken,
  useVariables,
} from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { useT } from '../../locale';
import { css } from '@emotion/css';
import { useForm } from '@formily/react';

export const AIEmployeeButton: React.FC<{
  aiEmployee: AIEmployee;
  extraInfo?: string;
}> = ({ aiEmployee, extraInfo }) => {
  const t = useT();
  const { setOpen, send, setAttachments, setFilterEmployee, setCurrentConversation, setActions } =
    useContext(ChatBoxContext);
  const { token } = useToken();
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaToolbarRender(fieldSchema);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const { name: blockType } = useBlockContext() || {};
  const form = useForm();

  return (
    <SortableItem
      style={{
        position: 'relative',
      }}
      onClick={async () => {
        setOpen(true);
        setCurrentConversation(undefined);
        setFilterEmployee(aiEmployee.username);
        setAttachments([]);
        setActions([]);
        const messages = [];
        if (blockType === 'form') {
          console.log(fieldSchema.parent.parent.toJSON());
          setAttachments((prev) => [
            ...prev,
            {
              type: 'uiSchema',
              content: fieldSchema.parent.parent['x-uid'],
            },
          ]);
          setActions([
            {
              content: 'Fill form',
              onClick: (content) => {
                try {
                  const values = content.replace('```json', '').replace('```', '');
                  form.setValues(JSON.parse(values));
                } catch (error) {
                  console.log(error);
                }
              },
            },
          ]);
        }
        let message = fieldSchema['x-component-props']?.message;
        if (message) {
          message = await variables
            ?.parseVariable(fieldSchema['x-component-props']?.message, localVariables)
            .then(({ value }) => value);
          messages.push({
            type: 'text',
            content: message,
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
            {extraInfo && (
              <>
                <Divider
                  orientation="left"
                  plain
                  style={{
                    fontStyle: 'italic',
                  }}
                >
                  {t('Extra information')}
                </Divider>
                <p>{extraInfo}</p>
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
};

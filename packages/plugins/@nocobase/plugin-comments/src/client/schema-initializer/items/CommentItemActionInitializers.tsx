/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  ActionInitializer,
  SchemaInitializer,
  useACLActionParamsContext,
  useCollection_deprecated,
  useDesignable,
} from '@nocobase/client';
import React, { useCallback, useEffect, useState } from 'react';
import { generateNTemplate, useTranslation } from '../../locale';

export function UpdateCommentActionButton() {
  const field = useField();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const aclCtx = useACLActionParamsContext();
  const { designable } = useDesignable();

  useEffect(() => {
    const address = field.address.slice(0, field.address.length - 2);
    field.form.setFieldState(address.concat('content'), (state) => {
      state.pattern = editing ? 'editable' : 'readPretty';
    });
    field.form.setFieldState(address, (state) => {
      state.componentProps = { ...state.componentProps, editing, setEditing };
    });
  }, [editing, field.address, field.form]);
  if (!designable && (field?.data?.hidden || !aclCtx)) {
    return null;
  }

  return (
    <a
      style={{ fontSize: 14, opacity: designable && (field?.data?.hidden || !aclCtx) && 0.1 }}
      onClick={() => {
        setEditing(true);
      }}
    >
      {t('Edit')}
    </a>
  );
}

export function UpdateCommentActionInitializer(props) {
  const schema: ISchema = {
    type: 'void',
    title: '{{t("Edit")}}',
    'x-component': 'UpdateCommentActionButton',
  };

  return <ActionInitializer {...props} schema={schema} />;
}

export function QuoteReplyCommentActionButton() {
  const field = useField();
  const { t } = useTranslation();

  const aclCtx = useACLActionParamsContext();
  const { designable } = useDesignable();

  const onClick = useCallback(() => {
    const submitCommentContentAddress = field.address.slice(0, field.address.length - 4).concat('submit.content');
    const quoteCommentContentAddress = field.address.slice(0, field.address.length - 2).concat('content');
    const content = field.form.getValuesIn(quoteCommentContentAddress) ?? '';
    field.form.setValuesIn(
      submitCommentContentAddress,
      `${content
        .split('\n')
        .map((_) => `> ${_}`)
        .join('\n')}`,
    );
  }, [field.address, field.form]);

  if (!designable && (field?.data?.hidden || !aclCtx)) {
    return null;
  }

  return (
    <a style={{ fontSize: 14 }} onClick={onClick}>
      {t('Quote Reply')}
    </a>
  );
}

export function QuoteReplyCommentActionInitializer(props) {
  const { t } = useTranslation();
  const schema: ISchema = {
    type: 'void',
    title: t('Quote Reply'),
    'x-component': 'QuoteReplyCommentActionButton',
  };

  return <ActionInitializer {...props} schema={schema} />;
}

export const commentItemActionInitializers = new SchemaInitializer({
  name: 'comment:configureItemActions',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: '{{t("Enable actions")}}',
      children: [
        {
          name: 'edit',
          title: '{{t("Edit")}}',
          Component: 'UpdateCommentActionInitializer',
          schema: {
            'x-action': 'update',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          name: 'delete',
          title: '{{t("Delete")}}',
          Component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'destroy',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return collection.template !== 'sql';
          },
        },
        {
          name: 'reply',
          title: generateNTemplate('Quote Reply'),
          Component: 'QuoteReplyCommentActionInitializer',
          schema: {
            'x-action': 'create',
            'x-decorator': 'ACLActionProvider',
            'x-align': 'left',
          },
          useVisible() {
            const collection = useCollection_deprecated();
            return collection.template !== 'sql';
          },
        },
        // {
        //   type: 'item',
        //   title: '{{t("Add child")}}',
        //   name: 'addChildren',
        //   Component: 'CreateChildInitializer',
        //   schema: {
        //     'x-component': 'Action.Link',
        //     'x-action': 'create',
        //     'x-decorator': 'ACLActionProvider',
        //   },
        // },
      ],
    },
  ],
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Sender } from '@ant-design/x';
import type { GetRef } from 'antd';
import { action, define, observable } from '@nocobase/flow-engine';
import type { Attachment, ContextItem, SkillSettings } from '../../types';

export type ChatSenderRef = React.MutableRefObject<GetRef<typeof Sender> | null>;
type ChatSenderStateUpdater<T> = T | ((prev: T) => T);

export class ChatSenderModel {
  senderValue = '';
  senderPlaceholder = '';
  senderRef: ChatSenderRef | null = {
    current: null,
  };
  isShowSenderHint = false;
  isEditingMessage = false;
  editingMessageId: string | null | undefined = null;

  attachments: Attachment[] = observable.shallow([]);
  contextItems: ContextItem[] = observable.shallow([]);
  systemMessage = '';
  skillSettings: SkillSettings | null | undefined = null;

  constructor() {
    define(this, {
      senderValue: observable.ref,
      senderPlaceholder: observable.ref,
      senderRef: observable.ref,
      isShowSenderHint: observable.ref,
      isEditingMessage: observable.ref,
      editingMessageId: observable.ref,
      attachments: observable.shallow,
      contextItems: observable.shallow,
      systemMessage: observable.ref,
      skillSettings: observable.ref,
      setSenderValue: action,
      setSenderPlaceholder: action,
      setSenderRef: action,
      setShowSenderHint: action,
      setIsEditingMessage: action,
      setEditingMessageId: action,
      setAttachments: action,
      addAttachments: action,
      removeAttachment: action,
      setContextItems: action,
      addContextItems: action,
      removeContextItem: action,
      setSystemMessage: action,
      setSkillSettings: action,
      reset: action,
    });
  }

  setSenderValue = (value: string) => {
    this.senderValue = value;
  };

  setSenderPlaceholder = (placeholder: string) => {
    this.senderPlaceholder = placeholder;
  };

  setSenderRef = (ref: ChatSenderRef | null) => {
    this.senderRef = ref;
  };

  setShowSenderHint = (isShowSenderHint: boolean) => {
    this.isShowSenderHint = isShowSenderHint;
  };

  setIsEditingMessage = (isEditing: boolean) => {
    this.isEditingMessage = isEditing;
  };

  setEditingMessageId = (id?: string | null) => {
    this.editingMessageId = id;
  };

  setAttachments = (attachments: ChatSenderStateUpdater<Attachment[]>) => {
    this.attachments = typeof attachments === 'function' ? attachments(this.attachments) : attachments;
  };

  addAttachments = (attachments: Attachment | Attachment[]) => {
    this.attachments = Array.isArray(attachments)
      ? [...this.attachments, ...attachments]
      : [...this.attachments, attachments];
  };

  removeAttachment = (filename: string) => {
    this.attachments = this.attachments.filter((attachment) => attachment.filename !== filename);
  };

  setContextItems = (items: ChatSenderStateUpdater<ContextItem[]>) => {
    this.contextItems = typeof items === 'function' ? items(this.contextItems) : items;
  };

  addContextItems = (items: ContextItem | ContextItem[]) => {
    const nextItems = Array.isArray(items) ? items : [items];
    const map = new Map<string, ContextItem>();
    for (const item of this.contextItems) {
      map.set(`${item.type}:${item.uid}`, item);
    }
    for (const item of nextItems) {
      map.set(`${item.type}:${item.uid}`, item);
    }
    this.contextItems = Array.from(map.values());
  };

  removeContextItem = (type: string, uid: string) => {
    this.contextItems = this.contextItems.filter((item) => !(item.type === type && item.uid === uid));
  };

  setSystemMessage = (msg: string | ((prev: string) => string)) => {
    this.systemMessage = typeof msg === 'function' ? msg(this.systemMessage) : msg;
  };

  setSkillSettings = (settings: SkillSettings | null | undefined) => {
    this.skillSettings = settings;
  };

  reset = () => {
    this.senderValue = '';
    this.senderPlaceholder = '';
    this.senderRef = {
      current: null,
    };
    this.isShowSenderHint = false;
    this.isEditingMessage = false;
    this.editingMessageId = undefined;
    this.attachments = [];
    this.contextItems = [];
    this.systemMessage = '';
    this.skillSettings = undefined;
  };
}

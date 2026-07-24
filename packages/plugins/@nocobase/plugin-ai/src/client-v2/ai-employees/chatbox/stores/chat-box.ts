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
import type { AIEmployee } from '../../types';
import type { ChatBubbleRole } from '../components/MessageRenderers';
import type { ChatSenderModel } from './chat-sender';

type RoleMap = Record<string, ChatBubbleRole>;
type ChatBoxTaskVariables = {
  variables?: Record<string, unknown>;
  localVariables?: Record<string, unknown>;
};

export interface ModelRef {
  llmService: string;
  model: string;
}

export class ChatBoxModel {
  private senderModel?: ChatSenderModel;
  legacySenderValue = '';
  legacySenderPlaceholder = '';
  legacyIsEditingMessage = false;
  legacyEditingMessageId: string | null | undefined = null;
  legacySenderRef: React.MutableRefObject<GetRef<typeof Sender> | null> | null = {
    current: null,
  };
  legacyIsShowSenderHint = false;

  open = false;
  expanded = false;
  collapsed = false;
  showConversations = false;
  minimize = false;

  currentEmployee: AIEmployee | null | undefined = null;
  roles: RoleMap = observable.shallow({});
  taskVariables: ChatBoxTaskVariables = observable.shallow({});

  chatBoxRef: React.MutableRefObject<HTMLDivElement | null> | null = {
    current: null,
  };
  showCodeHistory = false;

  model: ModelRef | null | undefined = null;

  showDebugPanel = false;
  readonly = false;

  constructor() {
    define(this, {
      open: observable.ref,
      expanded: observable.ref,
      collapsed: observable.ref,
      showConversations: observable.ref,
      minimize: observable.ref,
      currentEmployee: observable.ref,
      legacySenderValue: observable.ref,
      legacySenderPlaceholder: observable.ref,
      roles: observable.shallow,
      taskVariables: observable.shallow,
      legacyIsEditingMessage: observable.ref,
      legacyEditingMessageId: observable.ref,
      chatBoxRef: observable.ref,
      legacySenderRef: observable.ref,
      showCodeHistory: observable.ref,
      model: observable.ref,
      showDebugPanel: observable.ref,
      readonly: observable.ref,
      legacyIsShowSenderHint: observable.ref,
      attachSenderModel: action,
      setOpen: action,
      setExpanded: action,
      setCollapsed: action,
      setShowConversations: action,
      setMinimize: action,
      setCurrentEmployee: action,
      setSenderValue: action,
      setSenderPlaceholder: action,
      setTaskVariables: action,
      setRoles: action,
      addRole: action,
      setIsEditingMessage: action,
      setEditingMessageId: action,
      setChatBoxRef: action,
      setSenderRef: action,
      setShowCodeHistory: action,
      setModel: action,
      setShowDebugPanel: action,
      setReadonly: action,
      setShowSenderHint: action,
    });
  }

  get senderValue() {
    return this.senderModel?.senderValue ?? this.legacySenderValue;
  }

  set senderValue(value: string) {
    if (this.senderModel) {
      this.senderModel.setSenderValue(value);
      return;
    }
    this.legacySenderValue = value;
  }

  get senderPlaceholder() {
    return this.senderModel?.senderPlaceholder ?? this.legacySenderPlaceholder;
  }

  set senderPlaceholder(placeholder: string) {
    if (this.senderModel) {
      this.senderModel.setSenderPlaceholder(placeholder);
      return;
    }
    this.legacySenderPlaceholder = placeholder;
  }

  get isEditingMessage() {
    return this.senderModel?.isEditingMessage ?? this.legacyIsEditingMessage;
  }

  set isEditingMessage(isEditing: boolean) {
    if (this.senderModel) {
      this.senderModel.setIsEditingMessage(isEditing);
      return;
    }
    this.legacyIsEditingMessage = isEditing;
  }

  get editingMessageId() {
    return this.senderModel?.editingMessageId ?? this.legacyEditingMessageId;
  }

  set editingMessageId(id: string | null | undefined) {
    if (this.senderModel) {
      this.senderModel.setEditingMessageId(id);
      return;
    }
    this.legacyEditingMessageId = id;
  }

  get senderRef() {
    return this.senderModel?.senderRef ?? this.legacySenderRef;
  }

  set senderRef(ref: React.MutableRefObject<GetRef<typeof Sender> | null> | null) {
    if (this.senderModel) {
      this.senderModel.setSenderRef(ref);
      return;
    }
    this.legacySenderRef = ref;
  }

  get isShowSenderHint() {
    return this.senderModel?.isShowSenderHint ?? this.legacyIsShowSenderHint;
  }

  set isShowSenderHint(isShowSenderHint: boolean) {
    if (this.senderModel) {
      this.senderModel.setShowSenderHint(isShowSenderHint);
      return;
    }
    this.legacyIsShowSenderHint = isShowSenderHint;
  }

  attachSenderModel = (senderModel: ChatSenderModel) => {
    this.senderModel = senderModel;
  };

  setOpen = (open: boolean) => {
    this.open = open;
    if (!open) {
      this.collapsed = false;
    }
  };

  setExpanded = (expanded: boolean) => {
    this.expanded = expanded;
    if (expanded) {
      this.collapsed = false;
    }
  };

  setCollapsed = (collapsed: boolean) => {
    this.collapsed = collapsed;
  };

  setShowConversations = (show: boolean) => {
    this.showConversations = show;
  };

  setMinimize = (minimize: boolean) => {
    this.minimize = minimize;
  };

  setCurrentEmployee = (
    employee?: AIEmployee | null | ((prev: AIEmployee | null | undefined) => AIEmployee | null | undefined),
  ) => {
    this.currentEmployee = typeof employee === 'function' ? employee(this.currentEmployee) : employee;
  };

  setSenderValue = (value: string) => {
    this.senderValue = value;
  };

  setSenderPlaceholder = (placeholder: string) => {
    this.senderPlaceholder = placeholder;
  };

  setTaskVariables = (variables: ChatBoxTaskVariables) => {
    this.taskVariables = variables;
  };

  setRoles = (roles: RoleMap | ((prev: RoleMap) => RoleMap)) => {
    this.roles = typeof roles === 'function' ? roles(this.roles) : roles;
  };

  addRole = (name: string, role: RoleMap[string]) => {
    this.roles = {
      ...(this.roles ?? {}),
      [name]: role,
    };
  };

  setIsEditingMessage = (isEditing: boolean) => {
    this.isEditingMessage = isEditing;
  };

  setEditingMessageId = (id?: string | null) => {
    this.editingMessageId = id;
  };

  setChatBoxRef = (ref: React.MutableRefObject<HTMLDivElement | null> | null) => {
    this.chatBoxRef = ref;
  };

  setSenderRef = (ref: React.MutableRefObject<GetRef<typeof Sender> | null> | null) => {
    this.senderRef = ref;
  };

  setShowCodeHistory = (show: boolean) => {
    this.showCodeHistory = show;
  };

  setModel = (model: ModelRef | null | undefined) => {
    this.model = model;
  };

  setShowDebugPanel = (show: boolean) => {
    this.showDebugPanel = show;
  };

  setReadonly = (readonly: boolean) => {
    this.readonly = readonly;
  };

  setShowSenderHint = (isShowSenderHint: boolean) => {
    this.isShowSenderHint = isShowSenderHint;
  };
}

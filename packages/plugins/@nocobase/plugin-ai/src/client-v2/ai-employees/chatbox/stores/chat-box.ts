/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Bubble, Sender } from '@ant-design/x';
import type { GetProp, GetRef } from 'antd';
import { action, define, observable } from '@nocobase/flow-engine';
import type { AIEmployee } from '../../types';
import { getOrCreateGlobalStore } from '../../stores/global-store';
import { createObservableStore } from './create-selectors';

type RolesType = GetProp<typeof Bubble.List, 'roles'>;
type ChatBoxTaskVariables = {
  variables?: Record<string, unknown>;
  localVariables?: Record<string, unknown>;
};

export interface ModelRef {
  llmService: string;
  model: string;
}

interface ChatBoxState {
  open: boolean;
  expanded: boolean;
  collapsed: boolean;
  showConversations: boolean;
  minimize: boolean;

  currentEmployee?: AIEmployee;
  senderValue: string;
  senderPlaceholder: string;
  roles: GetProp<typeof Bubble.List, 'roles'>;
  taskVariables: ChatBoxTaskVariables;

  isEditingMessage: boolean;
  editingMessageId?: string;

  chatBoxRef: React.MutableRefObject<HTMLDivElement> | null;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>> | null;
  showCodeHistory: boolean;

  model?: ModelRef | null;

  showDebugPanel: boolean;
  readonly: boolean;
  isShowSenderHint: boolean;
}

interface ChatBoxActions {
  setOpen: (open: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  setShowConversations: (show: boolean) => void;
  setMinimize: (minus: boolean) => void;

  setCurrentEmployee: (aiEmployee?: AIEmployee | ((prev: AIEmployee) => AIEmployee)) => void;
  setSenderValue: (value: string) => void;
  setSenderPlaceholder: (placeholder: string) => void;
  setTaskVariables: (variables: ChatBoxState['taskVariables']) => void;
  setRoles: (roles: RolesType | ((prev: RolesType) => RolesType)) => void;
  addRole: (name: string, role: unknown) => void;

  setIsEditingMessage: (isEditing: boolean) => void;
  setEditingMessageId: (id?: string) => void;

  setChatBoxRef: (ref: React.MutableRefObject<HTMLDivElement> | null) => void;
  setSenderRef: (ref: React.MutableRefObject<GetRef<typeof Sender>> | null) => void;
  setShowCodeHistory: (show: boolean) => void;

  setModel: (model: ModelRef | null) => void;

  setShowDebugPanel: (show: boolean) => void;
  setReadonly: (readonly: boolean) => void;
  setShowSenderHint: (show: boolean) => void;
}

export class ChatBoxModel {
  open = false;
  expanded = false;
  collapsed = false;
  showConversations = false;
  minimize = false;

  currentEmployee: AIEmployee | null | undefined = null;
  senderValue = '';
  senderPlaceholder = '';
  roles: RolesType = observable.shallow({});
  taskVariables: ChatBoxTaskVariables = observable.shallow({});

  isEditingMessage = false;
  editingMessageId: string | null | undefined = null;

  chatBoxRef: React.MutableRefObject<HTMLDivElement | null> | null = {
    current: null,
  };
  senderRef: React.MutableRefObject<GetRef<typeof Sender> | null> | null = {
    current: null,
  };
  showCodeHistory = false;

  model: ModelRef | null | undefined = null;

  showDebugPanel = false;
  readonly = false;
  isShowSenderHint = false;

  constructor() {
    define(this, {
      open: observable.ref,
      expanded: observable.ref,
      collapsed: observable.ref,
      showConversations: observable.ref,
      minimize: observable.ref,
      currentEmployee: observable.ref,
      senderValue: observable.ref,
      senderPlaceholder: observable.ref,
      roles: observable.shallow,
      taskVariables: observable.shallow,
      isEditingMessage: observable.ref,
      editingMessageId: observable.ref,
      chatBoxRef: observable.ref,
      senderRef: observable.ref,
      showCodeHistory: observable.ref,
      model: observable.ref,
      showDebugPanel: observable.ref,
      readonly: observable.ref,
      isShowSenderHint: observable.ref,
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

  setRoles = (roles: RolesType | ((prev: RolesType) => RolesType)) => {
    this.roles = typeof roles === 'function' ? roles(this.roles) : roles;
  };

  addRole = (name: string, role: unknown) => {
    this.roles = {
      ...(this.roles ?? {}),
      [name]: role,
    } as RolesType;
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

export const useChatBoxStore = getOrCreateGlobalStore('@nocobase/plugin-ai/chat-box-store', () =>
  createObservableStore<ChatBoxState & ChatBoxActions>((set) => ({
    open: false,
    expanded: false,
    collapsed: false,
    showConversations: false,
    minimize: false,

    currentEmployee: null,
    senderValue: '',
    senderPlaceholder: '',
    taskVariables: {},
    roles: {},

    isEditingMessage: false,
    editingMessageId: null,

    chatBoxRef: {
      current: null,
    },
    senderRef: {
      current: null,
    },
    showCodeHistory: false,
    model: null,
    showDebugPanel: false,
    readonly: false,
    isShowSenderHint: false,

    setOpen: (open) => set({ open, ...(open ? {} : { collapsed: false }) }),
    setExpanded: (expanded) => set({ expanded, ...(expanded ? { collapsed: false } : {}) }),
    setCollapsed: (collapsed) => set({ collapsed }),
    setShowConversations: (show) => set({ showConversations: show }),
    setMinimize: (minus) => set({ minimize: minus }),

    setCurrentEmployee: (employee: AIEmployee | ((prev: AIEmployee) => AIEmployee)) =>
      set((state) => ({
        currentEmployee: typeof employee === 'function' ? employee(state.currentEmployee) : employee,
      })),
    setSenderValue: (val) => set({ senderValue: val }),
    setSenderPlaceholder: (val) => set({ senderPlaceholder: val }),
    setTaskVariables: (vars) => set({ taskVariables: vars }),

    setRoles: (roles: RolesType | ((prev: RolesType) => RolesType)) =>
      set((state) => ({
        roles: typeof roles === 'function' ? (roles as (prev: RolesType) => RolesType)(state.roles) : roles,
      })),
    addRole: (name, role) => set((state) => ({ roles: { ...state.roles, [name]: role } })),

    setIsEditingMessage: (isEditing) => set({ isEditingMessage: isEditing }),
    setEditingMessageId: (id) => set({ editingMessageId: id }),

    setChatBoxRef: (ref) => set({ chatBoxRef: ref }),
    setSenderRef: (ref) => set({ senderRef: ref }),
    setShowCodeHistory: (show) => set({ showCodeHistory: show }),
    setModel: (model) => set({ model }),
    setShowDebugPanel: (show) => set({ showDebugPanel: show }),
    setReadonly: (readonly) => set({ readonly }),
    setShowSenderHint: (isShowSenderHint) => set({ isShowSenderHint }),
  })),
);

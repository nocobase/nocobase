/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { Bubble, Sender } from '@ant-design/x';
import { GetProp, GetRef } from 'antd';
import { AIEmployee } from '../../types';
import { createSelectors } from './create-selectors';

type RolesType = GetProp<typeof Bubble.List, 'roles'>;

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
  taskVariables: {
    variables?: Record<string, any>;
    localVariables?: Record<string, any>;
  };

  isEditingMessage: boolean;
  editingMessageId?: string;

  chatBoxRef: React.MutableRefObject<HTMLDivElement> | null;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>> | null;
  showCodeHistory: boolean;

  model?: ModelRef | null;

  // [AI_DEBUG]
  showDebugPanel: boolean;
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
  addRole: (name: string, role: any) => void;

  setIsEditingMessage: (isEditing: boolean) => void;
  setEditingMessageId: (id?: string) => void;

  setChatBoxRef: (ref: React.MutableRefObject<HTMLDivElement> | null) => void;
  setSenderRef: (ref: React.MutableRefObject<GetRef<typeof Sender>> | null) => void;
  setShowCodeHistory: (show: boolean) => void;

  setModel: (model: ModelRef | null) => void;

  // [AI_DEBUG]
  setShowDebugPanel: (show: boolean) => void;
}

const store = create<ChatBoxState & ChatBoxActions>()((set) => ({
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
  // [AI_DEBUG]
  showDebugPanel: false,

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
  // [AI_DEBUG]
  setShowDebugPanel: (show) => set({ showDebugPanel: show }),
}));

export const useChatBoxStore = createSelectors(store);

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

interface ChatBoxState {
  open: boolean;
  expanded: boolean;
  showConversations: boolean;

  currentEmployee?: AIEmployee;
  senderValue: string;
  senderPlaceholder: string;
  roles: GetProp<typeof Bubble.List, 'roles'>;
  taskVariables: {
    variables?: Record<string, any>;
    localVariables?: Record<string, any>;
  };

  chatBoxRef: React.MutableRefObject<HTMLDivElement> | null;
  senderRef: React.MutableRefObject<GetRef<typeof Sender>> | null;
}

interface ChatBoxActions {
  setOpen: (open: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  setShowConversations: (show: boolean) => void;

  setCurrentEmployee: (aiEmployee?: AIEmployee | ((prev: AIEmployee) => AIEmployee)) => void;
  setSenderValue: (value: string) => void;
  setSenderPlaceholder: (placeholder: string) => void;
  setTaskVariables: (variables: ChatBoxState['taskVariables']) => void;
  setRoles: (roles: RolesType | ((prev: RolesType) => RolesType)) => void;
  addRole: (name: string, role: any) => void;

  setChatBoxRef: (ref: React.MutableRefObject<HTMLDivElement> | null) => void;
  setSenderRef: (ref: React.MutableRefObject<GetRef<typeof Sender>> | null) => void;
}

const store = create<ChatBoxState & ChatBoxActions>()((set) => ({
  open: false,
  expanded: false,
  showConversations: false,
  currentEmployee: null,
  senderValue: '',
  senderPlaceholder: '',
  taskVariables: {},
  roles: {},
  chatBoxRef: {
    current: null,
  },
  senderRef: {
    current: null,
  },

  setOpen: (open) => set({ open }),
  setExpanded: (expanded) => set({ expanded }),
  setShowConversations: (show) => set({ showConversations: show }),

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

  setChatBoxRef: (ref) => set({ chatBoxRef: ref }),
  setSenderRef: (ref) => set({ senderRef: ref }),
}));

export const useChatBoxStore = createSelectors(store);

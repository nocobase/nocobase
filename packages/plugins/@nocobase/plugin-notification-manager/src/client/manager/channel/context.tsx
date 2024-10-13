/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useState } from 'react';
import { RegisterChannelOptions } from './types';
export const NotificationTypeNameContext = createContext<{
  name: string;
  setName: (name: string) => void;
}>({ name: '', setName: () => {} });
NotificationTypeNameContext.displayName = 'ChannelTypeContext';

export const NotificationTypesContext = createContext<{
  channelTypes: Array<RegisterChannelOptions>;
}>({ channelTypes: [] });
NotificationTypesContext.displayName = 'ChannelTypesContext';

export const useChannelTypes = () => {
  const { channelTypes: types } = useContext(NotificationTypesContext);
  return types;
};

export function useNotificationTypeNameProvider() {
  const [name, setName] = useState('');
  const NotificationTypeNameProvider = ({ children }) => (
    <NotificationTypeNameContext.Provider value={{ name, setName }}>{children}</NotificationTypeNameContext.Provider>
  );
  return { name, setName, NotificationTypeNameProvider };
}

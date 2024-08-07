/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { useState } from 'react';
import { ChannelType } from './types';
export const ChannelTypeNameContext = createContext<{
  name: string;
  setName: (name: string) => void;
}>({ name: '', setName: () => {} });
ChannelTypeNameContext.displayName = 'ChannelTypeContext';

export const ChannelTypesContext = createContext<{
  channelTypes: Array<ChannelType>;
}>({ channelTypes: [] });
ChannelTypesContext.displayName = 'ChannelTypesContext';

export const useChannelTypes = () => {
  const { channelTypes: types } = useContext(ChannelTypesContext);
  return types;
};

export function useChannelTypeNameProvider() {
  const [name, setName] = useState('');
  const ChannelTypeNameProvider = ({ children }) => (
    <ChannelTypeNameContext.Provider value={{ name, setName }}>{children}</ChannelTypeNameContext.Provider>
  );
  return { name, setName, ChannelTypeNameProvider };
}

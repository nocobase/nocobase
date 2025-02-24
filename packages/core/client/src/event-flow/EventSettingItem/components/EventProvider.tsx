/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext } from 'react';

export const eventContext = createContext<{ pageUid: string }>({ pageUid: '' });

export const EventProvider = (props: { pageUid: string; children: React.ReactNode }) => {
  const { pageUid } = props;
  return <eventContext.Provider value={{ pageUid }}>{props.children}</eventContext.Provider>;
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useState } from 'react';
import { Selector } from '../types';

export const AISelectionContext = createContext<{
  selectable: string;
  selector?: Selector;
  startSelect: (selectType: string, selector?: Selector) => void;
  stopSelect: () => void;
}>({
  selectable: false,
} as any);

export const useAISelectionContext = () => {
  return useContext(AISelectionContext);
};

export const AISelectionProvider: React.FC = (props) => {
  const [selectable, setSelectable] = useState('');
  const [selector, setSelector] = useState<Selector>(null);

  const startSelect = (selectType: string, selector?: Selector) => {
    if (selector) {
      setSelector(selector);
    }
    setSelectable(selectType);
  };

  const stopSelect = () => {
    setSelectable('');
    setSelector(null);
  };

  return (
    <AISelectionContext.Provider value={{ selectable, selector, startSelect, stopSelect }}>
      {props.children}
    </AISelectionContext.Provider>
  );
};

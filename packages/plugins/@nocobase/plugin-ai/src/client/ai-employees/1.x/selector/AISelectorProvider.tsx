/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Selector } from '../../types';
import { useFlowEngine } from '@nocobase/flow-engine';

export const AISelectionContext = createContext<{
  selectable: string;
  selector?: Selector;
  startSelect: (selectType: string, selector?: Selector) => void;
  stopSelect: () => void;
  collect: (uid: string, key: string, value: any) => void;
  ctx: {
    [key: string]: Record<string, any>;
  };
}>({
  selectable: false,
} as any);

export const useAISelectionContext = () => {
  return useContext(AISelectionContext);
};

export const AISelectionProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const [selectable, setSelectable] = useState('');
  const [selector, setSelector] = useState<Selector>(null);
  const flowEngine = useFlowEngine();
  const [ctx, setCtx] = useState<{
    [key: string]: Record<string, any>;
  }>({
    flowEngine: flowEngine,
  });

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

  const collect = useCallback(
    (uid: string, key: string, value: any) => {
      setCtx((prev) => ({
        ...prev,
        [uid]: {
          ...prev[uid],
          [key]: value,
        },
      }));
    },
    [setCtx],
  );

  return (
    <AISelectionContext.Provider value={{ selectable, selector, startSelect, stopSelect, collect, ctx }}>
      {props.children}
    </AISelectionContext.Provider>
  );
};

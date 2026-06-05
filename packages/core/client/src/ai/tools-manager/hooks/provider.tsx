/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { ToolsEntry, ToolsManager } from '../types';
import { ToolsContext } from './context';

interface ToolsProviderProps {
  toolsManager: ToolsManager;
  children: ReactNode;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ toolsManager, children }) => {
  const [tools, setTools] = useState<ToolsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await toolsManager.listTools();
      setTools(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  return (
    <ToolsContext.Provider
      value={{
        tools,
        loading,
        error,
        refresh: loadTools,
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

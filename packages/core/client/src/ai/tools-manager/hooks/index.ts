/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';
import { useApp } from '../../../application';
import { ToolsEntry } from '../types';

export const useTools = () => {
  const [tools, setTools] = useState<ToolsEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState(null);
  const app = useApp();
  const { toolsManager } = app.aiManager;
  const toolsWithHooks = toolsManager.useTools();
  useEffect(() => {
    toolsManager
      .listTools()
      .then((items) => setTools(items.map((it) => ({ ...it, ...(toolsWithHooks.get(it.definition.name) ?? {}) }))))
      .finally(() => setLoading(false))
      .catch((e) => {
        console.error(e);
        setError(e);
      });
  }, []);

  return {
    tools,
    loading,
    error,
  };
};

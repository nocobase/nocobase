/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, useFlowEngine } from '@nocobase/flow-engine';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AIEmployeeShortcutListModel } from '../flow/models';
import { contextAware } from '../stores/context-aware';

export const useShortcuts = () => {
  const flowEngine = useFlowEngine();
  const { name } = useParams();
  const { pathname } = useLocation();

  const [result, setResult] = useState<{
    builtIn?: boolean;
    model: AIEmployeeShortcutListModel;
  }>({
    builtIn: true,
    model: null,
  });

  const loadModel = useCallback(async () => {
    let model: AIEmployeeShortcutListModel = await flowEngine.loadModel({
      uid: `ai-shortcuts-${name}`,
    });
    if (!model) {
      model = flowEngine.createModel({
        parentId: name,
        subKey: 'ai-shortcuts',
        uid: `ai-shortcuts-${name}`,
        use: 'AIEmployeeShortcutListModel',
      });
      model.isNewModel = true;
    }
    setResult({
      model,
    });
  }, [flowEngine, name]);

  useEffect(() => {
    if (pathname === '/admin/settings/data-source-manager/main/collections') {
      const model = flowEngine.createModel({
        uid: `ai-shortcuts-data-modeling`,
        use: 'AIEmployeeShortcutListModel',
        subModels: {
          shortcuts: [
            {
              uid: 'orin',
              use: 'AIEmployeeShortcutModel',
              props: {
                builtIn: true,
                aiEmployee: {
                  username: 'orin',
                },
              },
            },
          ],
        },
      }) as AIEmployeeShortcutListModel;
      setResult({
        builtIn: true,
        model,
      });
      contextAware.setAIEmployees([{ username: 'orin' }]);
      return;
    }

    contextAware.setAIEmployees([]);
    if (name) {
      loadModel();
      return;
    }

    setResult({
      builtIn: true,
      model: null,
    });
  }, [name, pathname, flowEngine]);

  return result;
};

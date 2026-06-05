/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useFlowEngine } from '@nocobase/flow-engine';
import { Plugin } from '../Plugin';
import { useApp } from './useApp';

export function usePlugin<T extends typeof Plugin = any>(plugin: T): InstanceType<T>;
export function usePlugin<T extends {}>(name: string): T;
export function usePlugin(name: any) {
  const application = useApp();
  const flowEngine = useFlowEngine({ throwError: false });
  const app = application || flowEngine.context.app;
  return app.pm.get(name);
}

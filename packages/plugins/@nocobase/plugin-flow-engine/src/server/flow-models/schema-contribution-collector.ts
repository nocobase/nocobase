/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowActionSchemaContribution,
  FlowFieldBindingContextContribution,
  FlowFieldBindingContribution,
  FlowModelSchemaContribution,
  FlowSchemaContribution,
  FlowSchemaContributionProvider,
  FlowSchemaInventoryContribution,
} from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/server';
import _ from 'lodash';
import { FlowSchemaService } from '../flow-schema-service';

type FlowSchemaPluginProvider = Plugin & Partial<FlowSchemaContributionProvider>;

export type RegisterFlowSchemasOptions = {
  models?: Record<string, any>;
  actions?: Record<string, any>;
  modelContributions?: any[] | Record<string, any>;
  actionContributions?: any[] | Record<string, any>;
  fieldBindingContexts?: FlowFieldBindingContextContribution[] | Record<string, FlowFieldBindingContextContribution>;
  fieldBindings?:
    | FlowFieldBindingContribution[]
    | Record<string, FlowFieldBindingContribution | FlowFieldBindingContribution[]>;
  inventory?: FlowSchemaInventoryContribution;
};

function inferFlowSchemaContributionSource(plugin: Plugin) {
  const packageName = String(plugin?.options?.packageName || '').trim();
  if (plugin?.name === 'flow-engine' || packageName === '@nocobase/plugin-flow-engine') {
    return 'official' as const;
  }
  if (packageName.startsWith('@nocobase/')) {
    return 'plugin' as const;
  }
  return 'third-party' as const;
}

function normalizeActionContributions(
  contributions: FlowSchemaContribution['actions'],
  defaults: NonNullable<FlowSchemaContribution['defaults']>,
): FlowActionSchemaContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean).map((contribution) => ({
      ...contribution,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([name, contribution]) => ({
      ...contribution,
      name: contribution.name || name,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
}

function normalizeModelContributions(
  contributions: FlowSchemaContribution['models'],
  defaults: NonNullable<FlowSchemaContribution['defaults']>,
): FlowModelSchemaContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean).map((contribution) => ({
      ...contribution,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([use, contribution]) => ({
      ...contribution,
      use: contribution.use || use,
      source: contribution.source ?? defaults.source,
      strict: contribution.strict ?? defaults.strict,
    }));
}

function normalizeFieldBindingContexts(
  contributions: FlowSchemaContribution['fieldBindingContexts'],
): FlowFieldBindingContextContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean);
  }

  return Object.entries(contributions)
    .filter(([, contribution]) => !!contribution)
    .map(([name, contribution]) => ({
      ...contribution,
      name: contribution.name || name,
    }));
}

function normalizeFieldBindings(
  contributions: FlowSchemaContribution['fieldBindings'],
): FlowFieldBindingContribution[] {
  if (!contributions) {
    return [];
  }

  if (Array.isArray(contributions)) {
    return contributions.filter(Boolean);
  }

  return Object.entries(contributions).flatMap(([context, contribution]) => {
    const items = Array.isArray(contribution) ? contribution : contribution ? [contribution] : [];
    return items.filter(Boolean).map((item) => ({
      ...item,
      context: item.context || context,
    }));
  });
}

function normalizeInventoryContribution(
  inventory: FlowSchemaContribution['inventory'],
): FlowSchemaInventoryContribution | undefined {
  if (!inventory) {
    return undefined;
  }

  const publicTreeRoots = Array.isArray(inventory.publicTreeRoots)
    ? _.uniq(inventory.publicTreeRoots.map((item) => String(item || '').trim()).filter(Boolean))
    : [];

  const slotUseExpansions = Array.isArray(inventory.slotUseExpansions)
    ? inventory.slotUseExpansions
        .map((item) => {
          const parentUse = String(item?.parentUse || '').trim();
          const slotKey = String(item?.slotKey || '').trim();
          const uses = Array.isArray(item?.uses)
            ? _.uniq(item.uses.map((use) => String(use || '').trim()).filter(Boolean))
            : [];
          if (!parentUse || !slotKey || uses.length === 0) {
            return undefined;
          }
          return {
            parentUse,
            slotKey,
            uses,
          };
        })
        .filter(Boolean)
    : [];

  if (!publicTreeRoots.length && !slotUseExpansions.length) {
    return undefined;
  }

  return {
    publicTreeRoots,
    slotUseExpansions,
  };
}

export class FlowSchemaContributionCollector {
  constructor(
    private readonly app: any,
    private readonly flowSchemaService: FlowSchemaService,
  ) {}

  async collectPluginFlowSchemaContributions() {
    for (const plugin of this.app.pm.getPlugins().values()) {
      if (!plugin?.enabled) {
        continue;
      }

      const provider = plugin as FlowSchemaPluginProvider;
      if (typeof provider.getFlowSchemaContributions !== 'function') {
        continue;
      }

      const contribution = await provider.getFlowSchemaContributions();
      if (!contribution) {
        continue;
      }

      this.registerContribution(contribution, {
        source: contribution.defaults?.source ?? inferFlowSchemaContributionSource(plugin),
        strict: contribution.defaults?.strict,
      });
    }
  }

  registerFlowSchemas(options: RegisterFlowSchemasOptions) {
    const defaults = {
      source: 'third-party' as const,
      strict: undefined,
    };
    if (options?.models) {
      this.flowSchemaService.registerModels(options.models);
    }
    if (options?.actions) {
      this.flowSchemaService.registerActions(options.actions);
    }

    this.registerContribution(
      {
        models: options?.modelContributions,
        actions: options?.actionContributions,
        fieldBindingContexts: options?.fieldBindingContexts,
        fieldBindings: options?.fieldBindings,
        inventory: options?.inventory,
        defaults,
      },
      defaults,
    );
  }

  private registerContribution(
    contribution: FlowSchemaContribution,
    defaults: NonNullable<FlowSchemaContribution['defaults']>,
  ) {
    const actionContributions = normalizeActionContributions(contribution.actions, defaults);
    const modelContributions = normalizeModelContributions(contribution.models, defaults);
    const fieldBindingContexts = normalizeFieldBindingContexts(contribution.fieldBindingContexts);
    const fieldBindings = normalizeFieldBindings(contribution.fieldBindings);
    const inventory = normalizeInventoryContribution(contribution.inventory);

    if (actionContributions.length > 0) {
      this.flowSchemaService.registerActionContributions(actionContributions);
    }
    if (modelContributions.length > 0) {
      this.flowSchemaService.registerModelContributions(modelContributions);
    }
    if (fieldBindingContexts.length > 0) {
      this.flowSchemaService.registerFieldBindingContexts(fieldBindingContexts);
    }
    if (fieldBindings.length > 0) {
      this.flowSchemaService.registerFieldBindings(fieldBindings, defaults.source);
    }
    if (inventory) {
      this.flowSchemaService.registerInventory(inventory, defaults.source);
    }
  }
}

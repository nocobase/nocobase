/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PortalRuntime } from './portal-runtime';
import type { ActivePortalHandle, PortalActivationBackend, PortalActivationRequest } from './portal-types';
import { PortalEventBus } from './events';

export class InProcessPortalBackend implements PortalActivationBackend {
  readonly kind = 'in-process' as const;

  constructor(private readonly globalEvents: PortalEventBus) {}

  async activate(request: PortalActivationRequest): Promise<ActivePortalHandle> {
    return PortalRuntime.create({
      version: request.version,
      definition: request.definition,
      createApp: request.createApp,
      globalEvents: this.globalEvents,
    });
  }
}

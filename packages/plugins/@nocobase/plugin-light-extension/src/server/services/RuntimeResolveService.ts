/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionRuntimeResolveInput, LightExtensionRuntimeResolveResult } from '../../shared/types';
import { LightExtensionPublicationResolveService } from './LightExtensionPublicationResolveService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';

export class RuntimeResolveService {
  constructor(private readonly publicationResolveService: LightExtensionPublicationResolveService) {}

  async resolve(
    input: LightExtensionRuntimeResolveInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRuntimeResolveResult> {
    return this.publicationResolveService.resolveRuntime(input, ctx);
  }
}

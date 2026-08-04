/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  RUNJS_EXTERNALIZATION_ENTRY_KINDS,
  type RunJSExternalizationCapabilityContribution,
} from '@nocobase/runjs-workspace/shared';

export const jsTemplateExternalizationCapabilities: RunJSExternalizationCapabilityContribution = {
  id: 'js-template',
  entryKinds: RUNJS_EXTERNALIZATION_ENTRY_KINDS,
  destinationTypes: RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  supportsIdempotency: true,
  supportsMoveToInline: true,
};

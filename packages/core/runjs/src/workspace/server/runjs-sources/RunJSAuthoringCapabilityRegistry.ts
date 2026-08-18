/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSExternalizationCapabilityContribution } from '../../shared/authoring-contract';

export class RunJSAuthoringCapabilityRegistry {
  private externalization?: {
    contribution: RunJSExternalizationCapabilityContribution;
    registrationId: number;
  };

  private nextRegistrationId = 1;

  registerExternalization(contribution: RunJSExternalizationCapabilityContribution): () => void {
    if (!contribution.id.trim()) {
      throw new Error('RunJS externalization capability contribution id is required');
    }
    if (this.externalization && this.externalization.contribution !== contribution) {
      throw new Error(`RunJS externalization capability contribution "${contribution.id}" is already registered`);
    }

    const registrationId = this.nextRegistrationId++;
    this.externalization = { contribution, registrationId };
    return () => {
      if (this.externalization?.registrationId === registrationId) {
        this.externalization = undefined;
      }
    };
  }

  getExternalization(): RunJSExternalizationCapabilityContribution | undefined {
    return this.externalization?.contribution;
  }
}

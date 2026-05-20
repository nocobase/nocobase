/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { ComponentType } from 'react';

export type VerificationFormProps = {
  verifier: string;
  actionType: string;
  boundInfo?: { bound?: boolean; publicInfo?: any };
  isLogged?: boolean;
};

export type BindFormProps = {
  verifier: string;
  actionType: string;
  isLogged?: boolean;
};

type LoaderOf<P = Record<string, never>> = () => Promise<{ default: ComponentType<P> }>;

export type VerificationTypeOptions = {
  /**
   * Async loaders for the type-specific forms. The manager stores loaders
   * rather than direct component references so each verifier type
   * contributes its own webpack chunk and is only fetched when a verifier
   * of that type is actually shown.
   *
   * Consumers wrap each loader with `React.lazy` (cached via `useMemo` or
   * a per-type cache to avoid re-creating the lazy wrapper) and render it
   * under `<Suspense>`.
   */
  components: {
    AdminSettingsFormLoader?: LoaderOf;
    VerificationFormLoader?: LoaderOf<VerificationFormProps>;
    BindFormLoader?: LoaderOf<BindFormProps>;
  };
};

export class VerificationManager {
  verifications = new Registry<VerificationTypeOptions>();

  registerVerificationType(type: string, options: VerificationTypeOptions) {
    this.verifications.register(type, options);
  }

  getVerification(type: string) {
    return this.verifications.get(type);
  }
}

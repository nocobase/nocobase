/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'react';

declare module 'react' {
  /**
   * The legacy client still relies on the React 17 convention that FC props
   * include children implicitly. Keep declaration builds compatible while
   * components are migrated to explicit PropsWithChildren types.
   */
  interface FunctionComponent<P = {}> {
    (props: 'children' extends keyof P ? P : PropsWithChildren<P>, deprecatedLegacyContext?: unknown): ReactNode;
  }
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UserCenterActionItemModel } from '@nocobase/client-v2';
import React from 'react';
import { NAMESPACE } from '../locale';
import { MyVerifiers } from './MyVerifiers';

const VERIFICATION_LABEL_NS = [NAMESPACE, 'client'];

/**
 * User Center entry that opens the "My verifiers" drawer. Section is
 * `profile` so it sits next to language / theme controls. Sort is
 * tightened to 150 to match v1's ordering, where Verification lived
 * between Profile (100) and Theme (200).
 *
 * The base `UserCenterTextItemView` renders `getLabelNode()`, which by
 * default routes through `this.context.t(label)` with no namespace —
 * that would never resolve the verification-namespaced key. Override
 * the node directly so the verification i18n namespace is consulted.
 */
export class VerificationUserCenterItemModel extends UserCenterActionItemModel {
  static itemId = 'verification';

  section = 'profile' as const;
  sort = 150;
  label = 'Verification';

  getLabelNode() {
    return this.context.t('Verification', { ns: VERIFICATION_LABEL_NS, nsMode: 'fallback' });
  }

  async onClick() {
    // `closable: true` overrides DrawerComponent's `closable={false}`
    // default so antd Drawer renders its native left-side X next to
    // the title — matches the v1 user-center drawer.
    this.context.viewer.drawer({
      title: this.context.t('Verification', { ns: VERIFICATION_LABEL_NS, nsMode: 'fallback' }),
      width: '50%',
      closable: true,
      content: () => <MyVerifiers />,
    });
  }
}

export default VerificationUserCenterItemModel;

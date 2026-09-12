/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getCurrentV2RedirectPath,
  redirectToV2Signin,
  resolveV2SigninRedirect,
  UserCenterActionItemModel,
} from '@nocobase/client-v2';

export class SignOutItemModel extends UserCenterActionItemModel {
  static itemId = 'sign-out';

  section = 'danger' as const;
  sort = 1000;
  label = 'Sign out';

  async onClick() {
    const response = await this.context.api.auth.signOut();
    const redirect = resolveV2SigninRedirect(response?.data?.data?.redirect, this.context.app);

    if (redirect) {
      window.location.replace(redirect);
      return;
    }

    redirectToV2Signin(this.context.app, getCurrentV2RedirectPath(this.context.app, window.location), {
      replace: true,
    });
  }
}

export default SignOutItemModel;

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { AuthModel } from '@nocobase/plugin-auth';
import { LDAPService } from './ldap-service';
import type { LDAPOption } from './types';

export class LDAPAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  getOptions(): LDAPOption {
    return this.options?.ldap || {};
  }

  async validate() {
    const { ctx } = this;
    const {
      params: { values },
    } = ctx.action;
    const { baseDN = '', ldapUrl, connectTimeout = 5000, password, reconnect = false, username } = this.getOptions();

    if (!ldapUrl) {
      throw new Error(`ldapUrl could not't be empty.`);
    }

    if (username && !this.validateUsername(username as string)) {
      throw new Error('Username must be 2-16 characters in length (excluding @.<>"\'/)');
    }

    const ldapService = new LDAPService({ ldapUrl, baseDN, connectTimeout, reconnect });
    const authenticator = this.authenticator as AuthModel;
    const { autoSignup } = this.options?.public || {};
    const authenticated = await ldapService.authenticate(username, password);
    let user;

    if (authenticated.success) {
      user = await ldapService.searchUser(username);

      if (user) {
        return user;
      } else {
        user = await this.userRepository.findOne({
          filter: { username },
        });
      }
    }

    if (user) {
      await authenticator.addUser(user.id, {
        through: {
          uuid: username,
        },
      });
      return user;
    }

    if (!autoSignup) {
      throw new Error('User not found');
    }

    return await authenticator.newUser(username, {
      username,
      nickname: username,
    });
  }
}

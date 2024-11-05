/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { Context } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import { HandlerType } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import { Provider, namespace } from '.';
import initActions from './actions';
import { CODE_STATUS_UNUSED, CODE_STATUS_USED, PROVIDER_TYPE_SMS_ALIYUN } from './constants';
import initProviders from './providers';

export interface Interceptor {
  manual?: boolean;
  expiresIn?: number;

  getReceiver(ctx): string;

  getCode?(ctx): string;

  validate?(ctx: Context, receiver: string): boolean | Promise<boolean>;
}

export default class PluginVerficationServer extends Plugin {
  providers: Registry<typeof Provider> = new Registry();
  interceptors: Registry<Interceptor> = new Registry();

  intercept: HandlerType = async (context, next) => {
    const { resourceName, actionName, values } = context.action.params;
    const key = `${resourceName}:${actionName}`;
    const interceptor = this.interceptors.get(key);

    if (!interceptor) {
      return context.throw(400);
    }

    const receiver = interceptor.getReceiver(context);
    const content = interceptor.getCode ? interceptor.getCode(context) : values.code;
    if (!receiver || !content) {
      return context.throw(400);
    }

    // check if code match, then call next
    // find the code based on action params
    const VerificationRepo = this.db.getRepository('verifications');
    const item = await VerificationRepo.findOne({
      filter: {
        receiver,
        type: key,
        content,
        expiresAt: {
          [Op.gt]: new Date(),
        },
        status: CODE_STATUS_UNUSED,
      },
    });

    if (!item) {
      return context.throw(400, {
        code: 'InvalidVerificationCode',
        message: context.t('Verification code is invalid', { ns: namespace }),
      });
    }

    // TODO: code should be removed if exists in values
    // context.action.mergeParams({
    //   values: {

    //   }
    // });
    try {
      await next();
    } finally {
      // or delete
      await item.update({
        status: CODE_STATUS_USED,
      });
    }
  };

  async install() {
    const {
      DEFAULT_SMS_VERIFY_CODE_PROVIDER,
      INIT_ALI_SMS_ACCESS_KEY,
      INIT_ALI_SMS_ACCESS_KEY_SECRET,
      INIT_ALI_SMS_ENDPOINT = 'dysmsapi.aliyuncs.com',
      INIT_ALI_SMS_VERIFY_CODE_TEMPLATE,
      INIT_ALI_SMS_VERIFY_CODE_SIGN,
    } = process.env;

    if (
      DEFAULT_SMS_VERIFY_CODE_PROVIDER &&
      INIT_ALI_SMS_ACCESS_KEY &&
      INIT_ALI_SMS_ACCESS_KEY_SECRET &&
      INIT_ALI_SMS_VERIFY_CODE_TEMPLATE &&
      INIT_ALI_SMS_VERIFY_CODE_SIGN
    ) {
      const ProviderRepo = this.db.getRepository('verifications_providers');
      const existed = await ProviderRepo.count({
        filterByTk: DEFAULT_SMS_VERIFY_CODE_PROVIDER,
      });
      if (existed) {
        return;
      }
      await ProviderRepo.create({
        values: {
          id: DEFAULT_SMS_VERIFY_CODE_PROVIDER,
          type: PROVIDER_TYPE_SMS_ALIYUN,
          title: 'Default SMS sender',
          options: {
            accessKeyId: INIT_ALI_SMS_ACCESS_KEY,
            accessKeySecret: INIT_ALI_SMS_ACCESS_KEY_SECRET,
            endpoint: INIT_ALI_SMS_ENDPOINT,
            sign: INIT_ALI_SMS_VERIFY_CODE_SIGN,
            template: INIT_ALI_SMS_VERIFY_CODE_TEMPLATE,
          },
          default: true,
        },
      });
    }
  }

  async load() {
    const { app, db, options } = this;

    await this.importCollections(path.resolve(__dirname, 'collections'));

    await initProviders(this);
    initActions(this);

    const self = this;
    // add middleware to action
    app.resourceManager.use(async function verificationIntercept(context, next) {
      const { resourceName, actionName, values } = context.action.params;
      const key = `${resourceName}:${actionName}`;
      const interceptor = self.interceptors.get(key);
      if (!interceptor || interceptor.manual) {
        return next();
      }

      return self.intercept(context, next);
    });

    app.acl.allow('verifications', 'create', 'public');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.providers`,
      actions: ['verifications_providers:*'],
    });
  }

  async getDefault() {
    const providerRepo = this.db.getRepository('verifications_providers');
    return providerRepo.findOne({
      filter: {
        default: true,
      },
    });
  }
}

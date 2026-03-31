/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import DysmsApi, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';
import { SMSProvider } from '.';

export default class extends SMSProvider {
  client: DysmsApi;

  constructor(options: any) {
    super(options);

    const { accessKeyId, accessKeySecret, endpoint } = this.options;

    const config = new OpenApi.Config({
      // 您的 AccessKey ID
      accessKeyId: accessKeyId,
      // 您的 AccessKey Secret
      accessKeySecret: accessKeySecret,
    });
    // 访问的域名
    config.endpoint = endpoint;

    this.client = new DysmsApi(config);
  }

  async send(phoneNumbers, data = {}) {
    const request = new SendSmsRequest({
      phoneNumbers,
      signName: this.options.sign,
      templateCode: this.options.template,
      templateParam: JSON.stringify(data),
    });

    try {
      const { body } = await this.client.sendSmsWithOptions(request, new RuntimeOptions({}));
      const err = new Error(body.message);
      switch (body.code) {
        case 'OK':
          break;

        case 'isv.MOBILE_NUMBER_ILLEGAL':
          err.name = 'InvalidReceiver';
          return Promise.reject(err);

        case 'isv.BUSINESS_LIMIT_CONTROL':
          err.name = 'RateLimit';
          console.error(body);
          return Promise.reject(err);

        // case 'isp.RAM_PERMISSION_DENY':
        default:
          // should not let user to know
          console.error(body);
          err.name = 'SendSMSFailed';
          return Promise.reject(err);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

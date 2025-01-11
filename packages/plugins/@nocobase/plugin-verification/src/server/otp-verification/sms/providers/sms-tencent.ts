/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { SMSProvider } from '.';

// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client;

export default class extends SMSProvider {
  client: InstanceType<typeof smsClient>;

  constructor(options) {
    super(options);

    const { secretId, secretKey, region, endpoint } = this.options;

    /* 实例化要请求产品(以sms为例)的client对象 */
    this.client = new smsClient({
      credential: {
        secretId,
        secretKey,
      },
      region,
      profile: {
        httpProfile: {
          endpoint,
        },
      },
    });
  }

  async send(phoneNumbers, data: { code: string }) {
    const { SignName, TemplateId, SmsSdkAppId } = this.options;
    const result = await this.client.SendSms({
      PhoneNumberSet: [phoneNumbers],
      SignName,
      TemplateId,
      SmsSdkAppId,
      TemplateParamSet: [data.code],
    });

    const errCode = result.SendStatusSet[0].Code;
    const error = new Error(`${errCode}:${result.SendStatusSet[0].Message}`);
    switch (errCode) {
      case 'Ok':
        return result.RequestId;
      case 'InvalidParameterValue.IncorrectPhoneNumber':
        error.name = 'InvalidReceiver';
        break;
      case 'LimitExceeded.DeliveryFrequencyLimit':
      case 'LimitExceeded.PhoneNumberDailyLimit':
      case 'LimitExceeded.PhoneNumberThirtySecondLimit':
      case 'LimitExceeded.PhoneNumberOneHourLimit':
        error.name = 'RateLimit';
    }
    throw error;
  }
}

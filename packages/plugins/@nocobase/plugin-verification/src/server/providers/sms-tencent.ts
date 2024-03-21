import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { Provider } from './Provider';

// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client;

export default class extends Provider {
  client: InstanceType<typeof smsClient>;

  constructor(plugin, options) {
    super(plugin, options);

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

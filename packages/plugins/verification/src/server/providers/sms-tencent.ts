import { Provider } from '.';
import * as tencentcloud from "tencentcloud-sdk-nodejs"

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
        secretKey
      },
      region,
      profile: {
        httpProfile: {
          endpoint: endpoint || "sms.tencentcloudapi.com"
        },
      },
    })
  }


  async send(PhoneNumberSet, data: { code: string }) {
    const { SignName, TemplateId, SmsSdkAppId } = this.options
    console.log("🚀 ~ file: sms-tencent.ts:35 ~ extends ~ send ~ this.options", this.options)
    console.log({
      PhoneNumberSet,
      SignName,
      TemplateId,
      SmsSdkAppId,
      TemplateParamSet: [data.code]
    })
    const result = await this.client.SendSms({
      PhoneNumberSet,
      SignName,
      TemplateId,
      SmsSdkAppId,
      TemplateParamSet: [data.code]
    })
    if (result.SendStatusSet[0].Code !== 'Ok') {
      const err = new Error(result.SendStatusSet[0].Message);
      err.name = 'SendSMSFailed';
      return Promise.reject(err);
    }
    return result.RequestId
  }
}

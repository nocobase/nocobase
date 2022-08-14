import DysmsApi, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';

import { Provider } from '.';
import { namespace } from '..';

export default class extends Provider {
  client: DysmsApi;

  constructor(plugin, options) {
    super(plugin, options);

    const { accessKeyId, accessKeySecret, endpoint } = this.options;

    let config = new OpenApi.Config({
      // 您的 AccessKey ID
      accessKeyId: accessKeyId,
      // 您的 AccessKey Secret
      accessKeySecret: accessKeySecret,
    });
    // 访问的域名
    config.endpoint = endpoint;

    this.client =  new DysmsApi(config);
  }

  async send(phoneNumbers, data = {}) {
    const request = new SendSmsRequest({
      phoneNumbers,
      signName: this.options.sign,
      templateCode: this.options.template,
      templateParam: JSON.stringify(data)
    });

    const { i18n } = this.plugin.app;

    try {
      const { body } = await this.client.sendSmsWithOptions(request, new RuntimeOptions({}));
      let err = new Error();
      switch (body.code) {
        case 'OK':
          break;

        case 'isv.MOBILE_NUMBER_ILLEGAL':
          err.name = 'InvalidReceiver';
          err.message = i18n.t('Not a valid cellphone number, please re-enter', {ns: namespace });
          return Promise.reject(err);

        case 'isv.BUSINESS_LIMIT_CONTROL':
        // should not let user to know
        default:
          console.error(body);
          err.name = 'SendSMSFailed';
          return Promise.reject(err);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

import { ISchema } from '@formily/react';
import { Registry } from '@nocobase/utils/client';
import SMSAliyun from './sms-aliyun';
import SMSTencent from './sms-tencent';

const providerTypes: Registry<ISchema> = new Registry();

providerTypes.register('sms-aliyun', SMSAliyun);
providerTypes.register('sms-tencent', SMSTencent);

export default providerTypes;

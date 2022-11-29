import { ISchema } from '@formily/react';
import { Registry } from "@nocobase/utils/client";
import SMSAliyun from './sms-aliyun';

const providerTypes: Registry<ISchema> = new Registry();

providerTypes.register('sms-aliyun', SMSAliyun);

export default providerTypes;

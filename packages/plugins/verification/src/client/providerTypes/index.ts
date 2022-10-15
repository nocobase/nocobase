import { Schema } from '@formily/react';
import { Registry } from "@nocobase/utils/client";
import SMSAliyun from './sms-aliyun';

const providerTypes: Registry<Schema> = new Registry();

providerTypes.register('sms-aliyun', SMSAliyun);

export default providerTypes;

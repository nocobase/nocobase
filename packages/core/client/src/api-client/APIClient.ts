import { APIClient as APIClientSDK } from '@nocobase/sdk';
import { Result } from 'ahooks/lib/useRequest/src/types';
import { notification } from 'antd';
import React from 'react';

export class APIClient extends APIClientSDK {
  services: Record<string, Result<any, any>> = {};

  service(uid: string) {
    return this.services[uid];
  }

  interceptors() {
    super.interceptors();
    this.notification();
  }

  notification() {
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const redirectTo = error?.response?.data?.redirectTo;
        if (redirectTo) {
          return (window.location.href = redirectTo);
        }
        notification.error({
          message: error?.response?.data?.errors?.map?.((error: any) => {
            return React.createElement('div', { children: error.message });
          }),
        });
        throw error;
      },
    );
  }
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { css, useAPIClient, withDynamicSchemaProps } from '@nocobase/client';
import { Button, Input, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const VerificationCode: React.FC<{
  actionType: string;
  verifier: string;
  value: string;
  onChange: (value: any) => void;
  isLogged?: boolean;
}> = withDynamicSchemaProps(
  ({ actionType, verifier, value, onChange, isLogged }) => {
    const { t } = useTranslation();
    const api = useAPIClient();
    const form = useForm();

    const [count, setCountdown] = useState<number>(0);
    const timer = useRef(null);

    useEffect(() => {
      if (count <= 0 && timer.current) {
        clearInterval(timer.current);
      }
    }, [count]);

    async function onGetCode() {
      if (count > 0) {
        return;
      }
      const method = isLogged ? 'create' : 'publicCreate';
      try {
        const {
          data: { data },
        } = await api.resource('smsOTP')[method]({
          values: {
            action: actionType,
            verifier,
            ...form.values,
          },
        });
        message.success(t('Operation succeeded'));
        if (value) {
          onChange('');
        }
        const expiresIn = data.expiresAt ? Math.ceil((Date.parse(data.expiresAt) - Date.now()) / 1000) : 60;
        setCountdown(expiresIn);
        timer.current = setInterval(() => {
          setCountdown((count) => count - 1);
        }, 1000);
      } catch (err) {
        console.error(err);
      }
    }

    return (
      <fieldset
        className={css`
          display: flex;
          gap: 0.5em;
        `}
      >
        <Input value={value} onChange={onChange} />
        <Button onClick={onGetCode} disabled={count > 0}>
          {count > 0 ? t('Retry after {{count}} seconds', { count }) : t('Send code')}
        </Button>
      </fieldset>
    );
  },
  {
    displayName: 'VerificationCode',
  },
);

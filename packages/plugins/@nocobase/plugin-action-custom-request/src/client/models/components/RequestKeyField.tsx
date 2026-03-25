/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { useFlowContext } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React from 'react';
import { loadCustomRequestRecord, makeRequestKey, toCustomRequestConfigurationInitialValues } from '../utils';

const requestConfigInFlight = new Map<string, Promise<any>>();

export const RequestKeyField = (props: { value?: string; onChange?: (value: string) => void }) => {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  const form = useForm();
  const loadedKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!value) {
      onChange?.(makeRequestKey());
    }
  }, [value, onChange]);

  React.useEffect(() => {
    if (!value || loadedKeyRef.current === value) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        let pending = requestConfigInFlight.get(value);
        if (!pending) {
          pending = loadCustomRequestRecord(ctx, value).finally(() => {
            requestConfigInFlight.delete(value);
          });
          requestConfigInFlight.set(value, pending);
        }

        const record = await pending;

        if (!mounted) {
          return;
        }

        const initialValues = toCustomRequestConfigurationInitialValues(record);
        form.setValues({
          method: initialValues.method || form.values?.method || 'POST',
          url: initialValues.url || form.values?.url,
          headers: Array.isArray(initialValues.headers) ? initialValues.headers : [],
          params: Array.isArray(initialValues.params) ? initialValues.params : [],
          data: initialValues.data,
          timeout: initialValues.timeout || form.values?.timeout || 5000,
          responseType: initialValues.responseType || form.values?.responseType || 'json',
          roles: initialValues.roles,
        });
        loadedKeyRef.current = value;
      } catch (error) {
        // ignore - this key may not have existing config yet
      }
    })();

    return () => {
      mounted = false;
    };
  }, [value, ctx, form]);

  return <Input value={value} disabled />;
};

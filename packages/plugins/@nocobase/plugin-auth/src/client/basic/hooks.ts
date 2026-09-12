/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useCurrentUserContext } from '@nocobase/client';
import React, { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@formily/react';

function shouldUseHardRedirect(target: string) {
  try {
    const url = new URL(target, window.location.origin);
    return /(?:^|\/)v2(?:\/|$)/.test(url.pathname);
  } catch (_error) {
    return /(?:^|\/)v2(?:\/|$)/.test(target);
  }
}

export function useRedirect(next = '/admin') {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useCallback(() => {
    const target = searchParams.get('redirect') || next;

    if (shouldUseHardRedirect(target)) {
      window.location.replace(target);
      return;
    }

    navigate(target, { replace: true });
  }, [navigate, next, searchParams]);
}

export const useSignIn = (authenticator: string) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  const { refreshAsync } = useCurrentUserContext();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      await refreshAsync();
      redirect();
    },
  };
};

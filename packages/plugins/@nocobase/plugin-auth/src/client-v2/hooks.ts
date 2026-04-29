/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@nocobase/client-v2';

export function useRedirect(next = '/admin') {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useCallback(() => {
    navigate(searchParams.get('redirect') || next, { replace: true });
  }, [navigate, next, searchParams]);
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function useSignIn(authenticator: string) {
  const app = useApp();
  const redirect = useRedirect();

  return {
    async run(values: Record<string, any>) {
      await app.apiClient.auth.signIn(values, authenticator);
      redirect();
    },
  };
}

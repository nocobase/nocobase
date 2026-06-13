/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ErrorLike = {
  message?: string;
  response?: {
    data?: {
      message?: string;
      errors?: { message?: string }[];
    };
  };
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const errorLike = error as ErrorLike;
  return (
    errorLike.response?.data?.errors?.[0]?.message || errorLike.response?.data?.message || errorLike.message || fallback
  );
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AI_EMPLOYEE_USERNAME_MAX_LENGTH = 64;
export const AI_EMPLOYEE_NICKNAME_MAX_LENGTH = 64;

export const AI_EMPLOYEE_USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const AI_EMPLOYEE_NICKNAME_PATTERN = /^[\p{L}\p{M}\p{N} ._'’()&·-]+$/u;

export const normalizeAIEmployeeName = (value: string) => value.trim();

const isWithinLength = (value: string, maxLength: number) => value.length > 0 && Array.from(value).length <= maxLength;

export const isValidAIEmployeeUsername = (value: string) => {
  const normalizedValue = normalizeAIEmployeeName(value);
  return (
    isWithinLength(normalizedValue, AI_EMPLOYEE_USERNAME_MAX_LENGTH) &&
    AI_EMPLOYEE_USERNAME_PATTERN.test(normalizedValue)
  );
};

export const isValidAIEmployeeNickname = (value: string) => {
  const normalizedValue = normalizeAIEmployeeName(value);
  return (
    isWithinLength(normalizedValue, AI_EMPLOYEE_NICKNAME_MAX_LENGTH) &&
    AI_EMPLOYEE_NICKNAME_PATTERN.test(normalizedValue) &&
    /[\p{L}\p{N}]/u.test(normalizedValue)
  );
};

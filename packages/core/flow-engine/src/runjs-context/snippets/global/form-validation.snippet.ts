/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';

const snippet: SnippetModule = {
  contexts: ['*'],
  prefix: 'sn-validate',
  label: 'Form data validation',
  description: 'Validate form data with custom rules',
  locales: {
    'zh-CN': {
      label: '表单数据验证',
      description: '使用自定义规则验证表单数据',
    },
  },
  content: `
// Define validation rules
const validate = (data) => {
  const errors = {};

  // Required field
  if (!data.username?.trim()) {
    errors.username = ctx.t('Username is required');
  }

  // Email format
  if (data.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) {
    errors.email = ctx.t('Invalid email format');
  }

  // Password strength
  if (data.password && data.password.length < 8) {
    errors.password = ctx.t('Password must be at least 8 characters');
  }

  // Numeric range
  if (data.age && (data.age < 18 || data.age > 100)) {
    errors.age = ctx.t('Age must be between 18 and 100');
  }

  // Confirm password
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = ctx.t('Passwords do not match');
  }

  return errors;
};

// Example usage
const formData = {
  username: 'john_doe',
  email: 'invalid-email',
  password: '123',
  confirmPassword: '123',
  age: 25,
};

const errors = validate(formData);

if (Object.keys(errors).length > 0) {
  console.error(ctx.t('Validation errors:'), errors);
  const errorMsg = Object.values(errors).join('\\n');
  ctx.message.error(errorMsg);
} else {
  ctx.message.success(ctx.t('Validation passed'));
}
`,
};

export default snippet;

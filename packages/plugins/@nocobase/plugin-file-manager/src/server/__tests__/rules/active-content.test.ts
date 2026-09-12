/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isDisallowedActiveContent } from '../../rules/active-content';

describe('active content upload rules', () => {
  it('rejects active content allowed only by a broad MIME pattern', () => {
    expect(isDisallowedActiveContent('logo.svg', 'image/svg+xml', 'image/*')).toBe(true);
  });

  it('requires the filename MIME type to be explicitly allowed', () => {
    expect(isDisallowedActiveContent('logo.svg', 'image/png', 'image/png')).toBe(true);
  });

  it('allows active content when its exact MIME type is configured', () => {
    expect(isDisallowedActiveContent('logo.svg', 'image/svg+xml', 'image/*, image/svg+xml')).toBe(false);
  });

  it('keeps wildcard rules unrestricted', () => {
    expect(isDisallowedActiveContent('logo.svg', 'image/svg+xml', '*')).toBe(false);
  });
});

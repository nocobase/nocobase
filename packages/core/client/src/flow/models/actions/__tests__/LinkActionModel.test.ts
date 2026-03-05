/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { handleLinkNavigation } from '../LinkActionUtils';

describe('handleLinkNavigation', () => {
  it('should navigate relative link without closing popup view implicitly', () => {
    const navigate = vi.fn();

    handleLinkNavigation({
      link: '/target-page',
      openInNewWindow: false,
      router: { navigate },
      isExternalLink: false,
    });

    expect(navigate).toHaveBeenCalledWith('/target-page', { replace: true });
  });

  it('should use location href for external link', () => {
    const navigate = vi.fn();
    const setLocationHref = vi.fn();

    handleLinkNavigation({
      link: 'https://www.nocobase.com/docs',
      openInNewWindow: false,
      router: { navigate },
      isExternalLink: true,
      setLocationHref,
    });

    expect(setLocationHref).toHaveBeenCalledWith('https://www.nocobase.com/docs');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should open link in new window when openInNewWindow is true', () => {
    const navigate = vi.fn();
    const setLocationHref = vi.fn();
    const openWindow = vi.fn();

    handleLinkNavigation({
      link: '/target-page',
      openInNewWindow: true,
      router: { navigate },
      isExternalLink: false,
      setLocationHref,
      openWindow,
    });

    expect(openWindow).toHaveBeenCalledWith(`${window.location.origin}/target-page`, '_blank');
    expect(navigate).not.toHaveBeenCalled();
    expect(setLocationHref).not.toHaveBeenCalled();
  });
});

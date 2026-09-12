/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { joinUrlSearch } from '../joinUrlSearch';
import { handleLinkNavigation, shouldDestroyViewAfterLinkNavigation } from '../LinkActionUtils';

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

describe('joinUrlSearch', () => {
  it('should append params into hash route', () => {
    const result = joinUrlSearch('https://example.com/pcEmpAppCenter/#/usermassage', [{ name: 'exp', value: 'm' }]);

    expect(result).toBe('https://example.com/pcEmpAppCenter/#/usermassage?exp=m');
  });

  it('should append params into hash route with existing hash query', () => {
    const result = joinUrlSearch('https://example.com/pcEmpAppCenter/#/usermassage?a=1', [{ name: 'exp', value: 'm' }]);

    expect(result).toBe('https://example.com/pcEmpAppCenter/#/usermassage?a=1&exp=m');
  });

  it('should append params before normal anchor hash', () => {
    const result = joinUrlSearch('https://example.com/page#section', [{ name: 'exp', value: 'm' }]);

    expect(result).toBe('https://example.com/page?exp=m#section');
  });

  it('should keep existing search params before normal anchor hash', () => {
    const result = joinUrlSearch('https://example.com/page?a=1#section', [{ name: 'exp', value: 'm' }]);

    expect(result).toBe('https://example.com/page?a=1&exp=m#section');
  });
});

describe('shouldDestroyViewAfterLinkNavigation', () => {
  it('should not destroy embed view for internal same-window link', () => {
    expect(
      shouldDestroyViewAfterLinkNavigation({
        openInNewWindow: false,
        isExternalLink: false,
        viewType: 'embed',
      }),
    ).toBe(false);
  });

  it('should destroy popup view for internal same-window link', () => {
    expect(
      shouldDestroyViewAfterLinkNavigation({
        openInNewWindow: false,
        isExternalLink: false,
        viewType: 'drawer',
      }),
    ).toBe(true);
  });
});

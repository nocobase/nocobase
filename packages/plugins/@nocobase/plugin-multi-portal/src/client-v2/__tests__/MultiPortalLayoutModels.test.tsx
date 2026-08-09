/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AdminLayoutModel } from '@nocobase/client-v2';
import { MobileLayoutModel } from '@nocobase/plugin-ui-layout/client-v2';
import React from 'react';
import { MultiPortalLayoutAccessBoundary } from '../PortalAccessBoundary';
import { MultiPortalDesktopLayoutModel } from '../models/MultiPortalLayoutModels';
import { MultiPortalMobileLayoutModel } from '../models/MultiPortalMobilePageModels';

describe('Multi Portal Layout access boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not invoke the desktop parent Layout renderer before the boundary allows access', () => {
    const parentRender = vi.spyOn(AdminLayoutModel.prototype, 'render').mockReturnValue(<div>Desktop Layout</div>);
    const model = { layout: { uid: 'desktop-portal' } } as MultiPortalDesktopLayoutModel;

    const element = MultiPortalDesktopLayoutModel.prototype.render.call(model);

    expect(parentRender).not.toHaveBeenCalled();
    expect(element.type).toBe(MultiPortalLayoutAccessBoundary);
    expect(element.props.portalUid).toBe('desktop-portal');
    expect(element.props.renderAllowed()).toEqual(<div>Desktop Layout</div>);
    expect(parentRender).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the mobile parent Layout renderer before the boundary allows access', () => {
    const parentRender = vi.spyOn(MobileLayoutModel.prototype, 'render').mockReturnValue(<div>Mobile Layout</div>);
    const model = { layout: { uid: 'mobile-portal' } } as MultiPortalMobileLayoutModel;

    const element = MultiPortalMobileLayoutModel.prototype.render.call(model);

    expect(parentRender).not.toHaveBeenCalled();
    expect(element.type).toBe(MultiPortalLayoutAccessBoundary);
    expect(element.props.portalUid).toBe('mobile-portal');
    expect(element.props.renderAllowed()).toEqual(<div>Mobile Layout</div>);
    expect(parentRender).toHaveBeenCalledTimes(1);
  });
});

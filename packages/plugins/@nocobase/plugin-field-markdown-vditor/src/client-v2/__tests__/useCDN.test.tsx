/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCDN } from '../components/const';

const flowContext = {
  app: {
    pm: {
      get: vi.fn(),
    },
  },
};

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => flowContext,
}));

function CDNReader() {
  const cdn = useCDN();
  return <span>{cdn}</span>;
}

describe('useCDN', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('initializes vditor dependencies once and returns the plugin CDN', () => {
    const plugin = {
      dependencyLoaded: false,
      initVditorDependency: vi.fn(),
      getCDN: vi.fn(() => 'https://cdn.example/vditor'),
    };
    flowContext.app.pm.get.mockReturnValue(plugin);

    const { rerender } = render(<CDNReader />);
    rerender(<CDNReader />);

    expect(screen.getByText('https://cdn.example/vditor')).toBeInTheDocument();
    expect(flowContext.app.pm.get).toHaveBeenCalledWith('@nocobase/plugin-field-markdown-vditor');
    expect(plugin.initVditorDependency).toHaveBeenCalledTimes(1);
    expect(plugin.dependencyLoaded).toBe(true);
    expect(plugin.getCDN).toHaveBeenCalledTimes(2);
  });
});

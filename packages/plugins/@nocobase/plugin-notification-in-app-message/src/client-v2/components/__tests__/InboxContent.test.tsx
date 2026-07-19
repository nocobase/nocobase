/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/flow-engine', () => ({
  observer: (component: React.ComponentType) => component,
}));

vi.mock('../../locale', () => ({
  useInAppMessageTranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

vi.mock('../../state', () => ({
  channelListObs: { value: [] },
  channelStatusFilterObs: { value: 'all' },
  fetchChannels: vi.fn().mockResolvedValue(undefined),
  inboxVisibleObs: { value: false },
  isFetchingChannelsObs: { value: false },
  selectedChannelNameObs: { value: null },
  showChannelLoadingMoreObs: { value: false },
}));

vi.mock('../FilterTab', () => ({
  default: () => <div data-testid="filter-tab" />,
}));

vi.mock('../MessageList', () => ({
  default: () => <div data-testid="message-list" />,
}));

import { InboxContent } from '../InboxContent';

describe('InboxContent', () => {
  it('keeps the channel list and message list in independent scroll containers', () => {
    const { container } = render(<InboxContent />);

    const layout = container.querySelector('.ant-layout');
    const sider = container.querySelector('.ant-layout-sider');
    const channelListPanel = screen.getByTestId('channel-list-panel');
    const channelList = container.querySelector('.ant-list');
    const content = container.querySelector('.ant-layout-content');

    expect(layout).toHaveStyle({ height: '100%', minHeight: '0', overflow: 'hidden' });
    expect(sider).toHaveStyle({
      height: '100%',
      minHeight: '0',
      overflow: 'hidden',
    });
    expect(channelListPanel).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '0',
    });
    expect(channelList).toHaveStyle({ flex: '1', minHeight: '0', overflowY: 'auto' });
    expect(content).toHaveStyle({ height: '100%', minHeight: '0', overflowY: 'auto' });
  });
});

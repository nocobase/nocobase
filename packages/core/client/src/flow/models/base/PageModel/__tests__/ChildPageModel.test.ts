/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChildPageModel } from '../ChildPageModel';
import { DragEndEvent } from '@dnd-kit/core';

// Mock PageModel
const mockPageModel = {
  static: {
    registerFlow: vi.fn(),
  },
};

vi.mock('../PageModel', () => ({
  PageModel: class {
    static registerFlow() {}
  },
}));

// Mock FlowEngine
const { mockUseFlowContext } = vi.hoisted(() => ({
  mockUseFlowContext: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  CreateModelOptions: {},
  useFlowContext: mockUseFlowContext,
}));

vi.mock('antd', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

vi.mock('@ant-design/icons', () => ({
  ArrowLeftOutlined: () => null,
}));

vi.mock('@ant-design/pro-layout', () => ({
  PageHeader: () => null,
}));

describe('ChildPageModel', () => {
  let childPageModel: ChildPageModel;
  let mockFlowEngine: any;
  let mockDragEndEvent: DragEndEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FlowEngine
    mockFlowEngine = {
      moveModel: vi.fn(),
    };

    // Create ChildPageModel instance
    childPageModel = new ChildPageModel({});
    (childPageModel as any).flowEngine = mockFlowEngine;

    // Mock DragEndEvent
    mockDragEndEvent = {
      active: {
        id: 'active-model-id',
        data: { current: {} },
        rect: { current: { initial: null, translated: null } },
      },
      over: {
        id: 'over-model-id',
        data: { current: {} },
        rect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
        },
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: null,
    } as DragEndEvent;
  });

  describe('createPageTabModelOptions', () => {
    it('should return CreateModelOptions with ChildPageTabModel use', () => {
      const options = childPageModel.createPageTabModelOptions();
      expect(options).toEqual({
        use: 'ChildPageTabModel',
      });
    });
  });

  describe('handleDragEnd', () => {
    it('should call flowEngine.moveModel with correct parameters', async () => {
      await childPageModel.handleDragEnd(mockDragEndEvent);

      expect(mockFlowEngine.moveModel).toHaveBeenCalledTimes(1);
      expect(mockFlowEngine.moveModel).toHaveBeenCalledWith('active-model-id', 'over-model-id');
    });

    it('should handle case when over is null', async () => {
      const eventWithNullOver = {
        ...mockDragEndEvent,
        over: null,
      };

      await expect(childPageModel.handleDragEnd(eventWithNullOver)).rejects.toThrow();

      expect(mockFlowEngine.moveModel).toBeCalledTimes(0);
    });
  });

  describe('tab bar extra content', () => {
    it('should render spacer in drawer mode', () => {
      mockUseFlowContext.mockReturnValue({
        themeToken: { paddingLG: 16, paddingXS: 8 },
        view: { type: 'drawer', close: vi.fn() },
      });

      const element = childPageModel.tabBarExtraContent.left as React.ReactElement;
      const { container } = render(element);
      const spacer = container.querySelector('span[aria-hidden="true"]') as HTMLSpanElement | null;

      expect(spacer).not.toBeNull();
      expect(spacer?.style.width).toBe('16px');
    });

    it('should render back button in embed mode', () => {
      mockUseFlowContext.mockReturnValue({
        themeToken: { paddingLG: 16, paddingXS: 8 },
        view: { type: 'embed', close: vi.fn() },
      });

      const element = childPageModel.tabBarExtraContent.left as React.ReactElement;
      render(element);

      expect(screen.getByRole('button', { name: 'back-button' })).toBeTruthy();
    });
  });
});

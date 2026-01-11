/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import React, { forwardRef, useImperativeHandle } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withAutoFocus } from '../withAutoFocus';

// Mock useKeepAlive hook
vi.mock('../../route-switch/antd/admin-layout/KeepAlive', () => ({
  useKeepAlive: vi.fn(),
}));

import { useKeepAlive } from '../../route-switch/antd/admin-layout/KeepAlive';

describe('withAutoFocus', () => {
  const mockUseKeepAlive = vi.mocked(useKeepAlive);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auto Focus Logic', () => {
    it('should call focus method when autoFocus=true and page is active', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const focusMock = vi.fn();
      const TestComponent = forwardRef<{ focus: () => void }>((props, ref) => {
        useImperativeHandle(ref, () => ({
          focus: focusMock,
        }));
        return <div>Test</div>;
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      render(<WrappedComponent autoFocus />);

      expect(focusMock).toHaveBeenCalledTimes(1);
    });

    it('should not call focus method when autoFocus=false', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const focusMock = vi.fn();
      const TestComponent = forwardRef<{ focus: () => void }>((props, ref) => {
        useImperativeHandle(ref, () => ({
          focus: focusMock,
        }));
        return <div>Test</div>;
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      render(<WrappedComponent autoFocus={false} />);

      expect(focusMock).not.toHaveBeenCalled();
    });

    it('should not call focus method when page is inactive', () => {
      mockUseKeepAlive.mockReturnValue({ active: false });

      const focusMock = vi.fn();
      const TestComponent = forwardRef<{ focus: () => void }>((props, ref) => {
        useImperativeHandle(ref, () => ({
          focus: focusMock,
        }));
        return <div>Test</div>;
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      render(<WrappedComponent autoFocus />);

      expect(focusMock).not.toHaveBeenCalled();
    });

    it('should not throw error when focus method is not available', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = forwardRef<HTMLDivElement>((props, ref) => {
        return <div ref={ref}>Test</div>;
      });

      const WrappedComponent = withAutoFocus(TestComponent);

      expect(() => {
        render(<WrappedComponent autoFocus />);
      }).not.toThrow();
    });
  });

  describe('Ref Forwarding', () => {
    it('should correctly forward ref to wrapped component', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = forwardRef<HTMLDivElement>((props, ref) => {
        return (
          <div ref={ref} data-testid="test-component">
            Test
          </div>
        );
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      const ref = React.createRef<HTMLDivElement>();

      render(<WrappedComponent ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.getAttribute('data-testid')).toBe('test-component');
    });

    it('should use internal ref when no external ref is provided', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const focusMock = vi.fn();
      const TestComponent = forwardRef<{ focus: () => void }>((props, ref) => {
        useImperativeHandle(ref, () => ({
          focus: focusMock,
        }));
        return <div>Test</div>;
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      render(<WrappedComponent autoFocus />);

      expect(focusMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Forwarding', () => {
    it('should correctly pass all props to wrapped component', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = ({ title, className, autoFocus }: any) => (
        <div data-testid="test-component" title={title} className={className}>
          autoFocus: {String(autoFocus)}
        </div>
      );

      const WrappedComponent = withAutoFocus(TestComponent);
      const { getByTestId } = render(<WrappedComponent title="test-title" className="test-class" autoFocus />);

      const element = getByTestId('test-component');
      expect(element.title).toBe('test-title');
      expect(element.className).toBe('test-class');
      expect(element.textContent).toBe('autoFocus: true');
    });

    it('should correctly pass children elements', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = ({ children }: any) => <div data-testid="test-component">{children}</div>;

      const WrappedComponent = withAutoFocus(TestComponent);
      const { getByTestId } = render(
        <WrappedComponent>
          <span>Child content</span>
        </WrappedComponent>,
      );

      const element = getByTestId('test-component');
      expect(element.textContent).toBe('Child content');
    });
  });

  describe('DOM Element Focus', () => {
    it('should be able to focus DOM elements', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = forwardRef<HTMLButtonElement>((props, ref) => {
        return (
          <button ref={ref} data-testid="test-button">
            Click me
          </button>
        );
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      const { getByTestId } = render(<WrappedComponent autoFocus />);

      const button = getByTestId('test-button');
      expect(document.activeElement).toBe(button);
    });

    it('should be able to focus input elements', () => {
      mockUseKeepAlive.mockReturnValue({ active: true });

      const TestComponent = forwardRef<HTMLInputElement>((props, ref) => {
        return <input ref={ref} data-testid="test-input" />;
      });

      const WrappedComponent = withAutoFocus(TestComponent);
      const { getByTestId } = render(<WrappedComponent autoFocus />);

      const input = getByTestId('test-input');
      expect(document.activeElement).toBe(input);
    });
  });
});

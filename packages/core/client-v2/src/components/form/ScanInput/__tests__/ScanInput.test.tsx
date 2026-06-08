/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ScanInput } from '../ScanInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../CodeScanner', () => ({
  CodeScanner: ({ visible, onScanSuccess }: { visible: boolean; onScanSuccess: (result: string) => void }) =>
    visible ? <button onClick={() => onScanSuccess('CODE-128')}>mock scan result</button> : null,
}));

describe('ScanInput', () => {
  it('passes manual input changes through', () => {
    const handleChange = vi.fn();

    render(<ScanInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'manual-code' } });

    expect(handleChange.mock.calls[0][0].target.value).toBe('manual-code');
  });

  it('passes scanned text through as the field value', () => {
    const handleChange = vi.fn();

    render(<ScanInput value="" onChange={handleChange} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Scan to input' }));
    fireEvent.click(screen.getByText('mock scan result'));

    expect(handleChange).toHaveBeenCalledWith('CODE-128');
  });

  it('opens scanner on pointer down without focusing the input', () => {
    const handleFocus = vi.fn();

    render(<ScanInput value="" onChange={() => undefined} onFocus={handleFocus} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: 'Scan to input' });

    expect(button).not.toHaveAttribute('tabindex', '-1');
    fireEvent.pointerDown(button);

    act(() => {
      input.focus();
    });

    expect(handleFocus).not.toHaveBeenCalled();
    expect(screen.getByText('mock scan result')).toBeInTheDocument();
  });

  it('opens scanner from the button click path', () => {
    render(<ScanInput value="" onChange={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Scan to input' }));

    expect(screen.getByText('mock scan result')).toBeInTheDocument();
  });

  it('uses the mobile native scan bridge when available', () => {
    const testWindow = window as Window & {
      JsBridge?: {
        invoke: (params: { action: 'scan' }, callback: (data: { url: string }) => void) => void;
      };
    };
    const originalJsBridge = testWindow.JsBridge;
    const handleChange = vi.fn();
    const invoke = vi.fn((params: { action: 'scan' }, callback: (data: { url: string }) => void) => {
      callback({ url: 'BRIDGE-CODE' });
    });
    testWindow.JsBridge = { invoke };

    try {
      render(<ScanInput value="" onChange={handleChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Scan to input' }));

      expect(invoke).toHaveBeenCalledWith({ action: 'scan' }, expect.any(Function));
      expect(handleChange).toHaveBeenCalledWith('BRIDGE-CODE');
      expect(screen.queryByText('mock scan result')).not.toBeInTheDocument();
    } finally {
      testWindow.JsBridge = originalJsBridge;
    }
  });

  it('does not call preventDefault from touchstart', () => {
    render(<ScanInput value="" onChange={() => undefined} />);

    const event = new Event('touchstart', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    screen.getByRole('button', { name: 'Scan to input' }).dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('keeps scan available when manual input is disabled', () => {
    render(<ScanInput disableManualInput value="" onChange={() => undefined} />);

    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Scan to input' })).not.toBeDisabled();
  });

  it('disables the scan button when the field is disabled', () => {
    render(<ScanInput disabled value="" onChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Scan to input' })).toBeDisabled();
  });
});

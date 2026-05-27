/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
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
    fireEvent.click(screen.getByRole('button', { name: 'Scan to input' }));
    fireEvent.click(screen.getByText('mock scan result'));

    expect(handleChange).toHaveBeenCalledWith('CODE-128');
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

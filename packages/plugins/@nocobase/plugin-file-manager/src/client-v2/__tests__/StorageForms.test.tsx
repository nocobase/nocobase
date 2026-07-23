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
import { Form } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DefaultField } from '../components';
import AliOssStorageForm from '../storage-forms/AliOssStorageForm';
import LocalStorageForm from '../storage-forms/LocalStorageForm';
import S3StorageForm from '../storage-forms/S3StorageForm';
import TxCosStorageForm from '../storage-forms/TxCosStorageForm';

vi.mock('@nocobase/client-v2', () => ({
  EnvVariableInput: (props: Record<string, unknown>) => (
    <input
      aria-label={String(props.placeholder || props.addonBefore || 'env-variable-input')}
      data-password={props.password ? 'true' : 'false'}
    />
  ),
  FileSizeInput: (props: Record<string, unknown>) => (
    <input aria-label="file-size-input" data-min={String(props.min)} data-max={String(props.max)} />
  ),
  JsonTextArea: () => <textarea aria-label="json-text-area" />,
}));

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

function renderStorageForm(children: React.ReactNode) {
  return render(<Form>{children}</Form>);
}

function expectFormLabel(title: string) {
  expect(document.querySelector(`[title="${title}"]`)).toBeInTheDocument();
}

describe('storage forms', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the local storage form with hidden base fields and local path prefix', () => {
    renderStorageForm(<LocalStorageForm />);

    expectFormLabel('Title :');
    expectFormLabel('Storage name :');
    expect(screen.getByLabelText('storage/uploads/')).toBeInTheDocument();
    expectFormLabel('File size limit :');
    expect(screen.getByText('Default storage')).toBeInTheDocument();
    expect(screen.getByText('Keep file in storage when destroy the file record')).toBeInTheDocument();
  });

  it('renders Aliyun OSS fields including timeout, thumbnail and request options', () => {
    renderStorageForm(<AliOssStorageForm />);

    expectFormLabel('Base URL :');
    expectFormLabel('Region :');
    expectFormLabel('AccessKey ID :');
    expectFormLabel('AccessKey Secret :');
    expectFormLabel('Bucket :');
    expectFormLabel('Timeout :');
    expect(
      screen.getByLabelText('?x-oss-process=image/auto-orient,1/resize,m_fill,w_94,h_94/quality,q_90'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('json-text-area')).toBeInTheDocument();
  });

  it('renders S3 and Tencent COS provider-specific fields', () => {
    const { rerender } = renderStorageForm(<S3StorageForm />);

    expectFormLabel('AccessKey Secret :');
    expectFormLabel('Endpoint :');

    rerender(
      <Form>
        <TxCosStorageForm />
      </Form>,
    );

    expectFormLabel('SecretId :');
    expectFormLabel('SecretKey :');
    expectFormLabel('Thumbnail rule :');
  });

  it('disables the default checkbox when editing the current default storage', () => {
    renderStorageForm(<DefaultField disabled />);

    expect(screen.getByRole('checkbox', { name: 'Default storage' })).toBeDisabled();
  });
});

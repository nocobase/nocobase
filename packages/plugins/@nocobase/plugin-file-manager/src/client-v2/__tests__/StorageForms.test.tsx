/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DefaultField, UseOriginalUrlField } from '../components';
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

function expectFormLabelOrder(...titles: string[]) {
  const labels = titles.map((title) => document.querySelector(`[title="${title}"]`));
  labels.forEach((label) => expect(label).toBeInTheDocument());
  for (let index = 1; index < labels.length; index += 1) {
    expect(labels[index - 1]?.compareDocumentPosition(labels[index] as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  }
}

function UrlOptionsValue() {
  const form = Form.useFormInstance();
  const useOriginalUrl = Form.useWatch(['options', 'useOriginalUrl'], { form, preserve: true });
  const publicAccess = Form.useWatch(['options', 'public'], { form, preserve: true });
  return (
    <>
      <span data-testid="use-original-url-value">{String(useOriginalUrl)}</span>
      <span data-testid="public-access-value">{String(publicAccess)}</span>
    </>
  );
}

describe('storage forms', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the local storage form with hidden base fields and local path prefix', async () => {
    renderStorageForm(<LocalStorageForm />);

    expectFormLabel('Title :');
    expectFormLabel('Storage name :');
    expect(screen.getByLabelText('storage/uploads/')).toBeInTheDocument();
    expectFormLabel('File size limit :');
    expect(screen.getByRole('radio', { name: /NocoBase URL/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Original URL/ })).toBeInTheDocument();
    expect(
      screen.getByText('Uses a NocoBase file URL and follows the view permissions configured for the file record.'),
    ).toBeInTheDocument();
    expect(screen.getByText('/files/main/main/attachments/1.png')).toBeInTheDocument();
    expect(screen.getByText('https://storage.example.com/path/to/file.png')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeInTheDocument();
    const publicAccessDescription =
      'When checked, anyone with the file URL can access the file without NocoBase permission checks.';
    const publicAccessHelp = screen.getByRole('img', { name: publicAccessDescription });
    expect(publicAccessHelp).toHaveClass('anticon-question-circle');
    fireEvent.mouseEnter(publicAccessHelp);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(publicAccessDescription);
    });
    expect(screen.getByText('Default storage')).toBeInTheDocument();
    expect(screen.getByText('Keep file in storage when destroy the file record')).toBeInTheDocument();
    expectFormLabelOrder('Path :', 'Renaming :', 'File URL :', 'File size limit :');
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
    expect(screen.getByRole('radio', { name: /NocoBase URL/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Original URL/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeInTheDocument();
    expectFormLabelOrder('Path :', 'Renaming :', 'File URL :', 'File size limit :');
  });

  it('renders S3 and Tencent COS provider-specific fields', () => {
    const { rerender } = renderStorageForm(<S3StorageForm />);

    expectFormLabel('AccessKey Secret :');
    expectFormLabel('Endpoint :');
    expect(screen.getByRole('radio', { name: /NocoBase URL/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Original URL/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeInTheDocument();
    expectFormLabelOrder('Path :', 'Renaming :', 'File URL :', 'File size limit :');

    rerender(
      <Form>
        <TxCosStorageForm />
      </Form>,
    );

    expectFormLabel('SecretId :');
    expectFormLabel('SecretKey :');
    expectFormLabel('Thumbnail rule :');
    expect(screen.getByRole('radio', { name: /NocoBase URL/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Original URL/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeInTheDocument();
    expectFormLabelOrder('Path :', 'Renaming :', 'File URL :', 'File size limit :');
  });

  it('disables the default checkbox when editing the current default storage', () => {
    renderStorageForm(<DefaultField disabled />);

    expect(screen.getByRole('checkbox', { name: 'Default storage' })).toBeDisabled();
  });

  it('allows a storage engine to customize the original URL example', () => {
    const signedUrl = 'https://storage.example.com/path/to/file.png?X-Amz-Signature=xxxx';
    const unsignedUrl = 'https://storage.example.com/path/to/file.png';
    const { rerender } = render(
      <Form>
        <UseOriginalUrlField originalUrlExample={signedUrl} />
      </Form>,
    );

    expect(screen.getByText(signedUrl)).toBeInTheDocument();

    rerender(
      <Form>
        <UseOriginalUrlField originalUrlExample={unsignedUrl} />
      </Form>,
    );

    expect(screen.queryByText(signedUrl)).not.toBeInTheDocument();
    expect(screen.getByText(unsignedUrl)).toBeInTheDocument();
  });

  it('hides and clears public access when original URLs are selected', async () => {
    render(
      <Form initialValues={{ options: { useOriginalUrl: false, public: true } }}>
        <LocalStorageForm />
        <UrlOptionsValue />
      </Form>,
    );

    expect(screen.getByRole('radio', { name: /NocoBase URL/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: /Original URL/ }));
    await waitFor(() => {
      expect(screen.getByTestId('use-original-url-value')).toHaveTextContent('true');
      expect(screen.getByTestId('public-access-value')).toHaveTextContent('false');
      expect(screen.queryByRole('checkbox', { name: 'Allow public access' })).not.toBeInTheDocument();
    });
  });
});

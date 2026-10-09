import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import plugin from '../../client/plugin.js';
import { FilePreviewField } from '../../.registry-test-app/client/extensions/nocobase-file-component-ui/components/file-preview-field.js';

it('uses the file plugin locale outside its namespace and updates on language changes', async () => {
  const definition = plugin();
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace(definition.packageName, definition.locales ?? {});
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <FilePreviewField files={[]} />
    </I18nProvider>,
  );
  expect(screen.getByText('No files.')).toBeVisible();
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(screen.getByText('暂无文件。')).toBeVisible();
});

it('translates stored preview errors and preserves unknown server messages', async () => {
  const { FilePreviewContent } =
    await import('../../.registry-test-app/client/extensions/nocobase-file-component-ui/components/previewers/file-preview-content.js');
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace(plugin().packageName, plugin().locales ?? {});
  await runtime.init('zh-CN');
  const file = {
    id: '1',
    filename: 'notes.txt',
    mimeType: 'text/plain',
    disk: 'local',
    key: 'notes.txt',
    ext: '.txt',
    createdAt: '2026-09-17',
    updatedAt: '2026-09-17',
    size: 1,
  };
  const view = render(
    <I18nProvider runtime={runtime}>
      <FilePreviewContent
        file={file}
        kind='text'
        error='Unable to load the file preview.'
        onDownload={() => {}}
      />
    </I18nProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('无法加载文件预览。');
  view.rerender(
    <I18nProvider runtime={runtime}>
      <FilePreviewContent
        file={file}
        kind='text'
        error='Custom server error'
        onDownload={() => {}}
      />
    </I18nProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Custom server error');
});

it('retranslates a stored generic upload error after changing language', async () => {
  const { fireEvent } = await import('@testing-library/react');
  const { FileUploadField } =
    await import('../../.registry-test-app/client/extensions/nocobase-file-component-ui/components/file-upload-field.js');
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace(plugin().packageName, plugin().locales ?? {});
  await runtime.init('zh-CN');
  const { ClientFileRepositoryManager } =
    await import('../../client/manager.js');
  const manager = new ClientFileRepositoryManager({
    repository: () => ({}),
    request: () => Promise.reject(null),
  } as never);
  render(
    <I18nProvider runtime={runtime}>
      <FileUploadField
        repository={manager.repository('files')}
        value={[]}
        onChange={() => {}}
      />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByLabelText('选择文件', { selector: 'input' }), {
    target: { files: [new File(['x'], 'x.txt', { type: 'text/plain' })] },
  });
  expect(await screen.findByText('文件上传失败。')).toBeVisible();
  await act(() => runtime.changeLanguage('en-US'));
  expect(screen.getByText('File upload failed.')).toBeVisible();
});

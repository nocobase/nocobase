import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  clientFileRepositoryManagerToken,
  type ClientFileRepository,
  type ClientFileRepositoryManager,
  type FileRecord,
} from '@nocobase/app-plugin-file/client';
import fileRepository from '../client/index.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import enUS from '../client/locales/en-US.js';

const state = vi.hoisted(() => ({
  manager: undefined as ClientFileRepositoryManager | undefined,
}));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...original,
    useService: (token: unknown) => {
      expect(token).toBe(clientFileRepositoryManagerToken);
      return state.manager;
    },
  };
});

// Rendered without a namespace scope, so a strict runtime only finds these keys if the page names its own namespace.
const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-file-example': enUS },
});

interface RouteNode {
  readonly name: string;
  readonly path?: string;
  readonly children?: readonly RouteNode[];
  readonly componentLoader?: () => Promise<{ default: () => unknown }>;
}

function findRoute(
  nodes: readonly RouteNode[],
  name: string,
): RouteNode | undefined {
  for (const node of nodes) {
    if (node.name === name) return node;
    const found = node.children ? findRoute(node.children, name) : undefined;
    if (found) return found;
  }
  return undefined;
}

describe('File Repository example pages', () => {
  it('registers the attachments, profile avatar and order attachment pages', () => {
    const contribution = fileRepository().routes.find(
      (route) => route.parent === 'app',
    );
    const routes = contribution?.routes as readonly RouteNode[] | undefined;
    expect(routes?.[0]?.navigation).toMatchObject({ title: 'navGroup' });
    for (const [name, path] of [
      ['file-repository-attachments', '/file-repository'],
      ['file-repository-profile-avatars', '/file-repository/profile-avatars'],
      [
        'file-repository-order-attachments',
        '/file-repository/order-attachments',
      ],
    ] as const) {
      const route = findRoute(routes ?? [], name);
      expect(route?.path).toBe(path);
      expect(typeof route?.componentLoader).toBe('function');
    }
  });

  it('uploads through the file input and deletes metadata records', async () => {
    const records: FileRecord[] = [];
    let sequence = 0;
    const create = (file: File): FileRecord => {
      sequence += 1;
      return {
        id: `id-${sequence}`,
        disk: 'local',
        key: file.name,
        filename: file.name,
        ext: 'png',
        mimeType: file.type,
        size: file.size,
        createdAt: '2026-09-11T00:00:00',
        updatedAt: '2026-09-11T00:00:00',
        contentUrl: `/main/uploads/attachments/${file.name}`,
      };
    };
    const repository = {
      findMany: vi.fn(() => Promise.resolve([...records])),
      uploadOne: vi.fn(({ file }: { file: File }) => {
        const record = create(file);
        records.push(record);
        return Promise.resolve({ record });
      }),
      uploadMany: vi.fn(({ files }: { files: File[] }) => {
        const created = files.map((file) => create(file));
        records.push(...created);
        return Promise.resolve({
          records: created,
          createdCount: created.length,
        });
      }),
      deleteOne: vi.fn(({ filter }: { filter: { id: string } }) => {
        records.splice(
          records.findIndex((record) => record.id === filter.id),
          1,
        );
        return Promise.resolve({ deleted: true });
      }),
    } as unknown as ClientFileRepository;
    state.manager = {
      repository: vi.fn(() => repository),
    } as unknown as ClientFileRepositoryManager;
    const contribution = fileRepository().routes.find(
      (route) => route.parent === 'app',
    );
    const route = findRoute(
      contribution?.routes as readonly AppClientRegisteredRoute[],
      'file-repository-attachments',
    ) as RouteNode;
    const { default: Page } = (await route.componentLoader!()) as {
      default: () => ReactElement;
    };
    render(
      <TestI18nProvider runtime={runtime}>
        <Page />
      </TestI18nProvider>,
    );
    await screen.findByText('No files yet.');

    const first = new File(['one'], 'one.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose files'), {
      target: { files: [first] },
    });
    await waitFor(() =>
      expect(repository.uploadOne).toHaveBeenCalledWith({ file: first }),
    );
    await screen.findByText('one.png');

    const second = new File(['two'], 'two.png', { type: 'image/png' });
    const third = new File(['three'], 'three.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose files'), {
      target: { files: [second, third] },
    });
    await waitFor(() =>
      expect(repository.uploadMany).toHaveBeenCalledWith({
        files: [second, third],
      }),
    );
    await screen.findByText('two.png');
    expect(screen.getByText('three.png')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview: one.png' }));
    const dialog = document.querySelector('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog?.querySelector('img')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete: one.png' }));
    await waitFor(() =>
      expect(repository.deleteOne).toHaveBeenCalledWith({
        filter: { id: 'id-1' },
      }),
    );
    await waitFor(() => expect(screen.queryByText('one.png')).toBeNull());
  });
});

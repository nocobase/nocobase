import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import fileRepository from '../client/index.js';
import enUS from '../client/locales/en-US.js';

interface RouteNode {
  readonly name: string;
  readonly children?: readonly RouteNode[];
  readonly componentLoader?: () => Promise<{ default: () => ReactElement }>;
}

const state = vi.hoisted(() => ({
  manager: undefined as unknown,
  api: undefined as unknown,
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...original,
    useApiClient: () => state.api,
    useService: (token: unknown) =>
      token === clientFileRepositoryManagerToken ? state.manager : state.api,
  };
});

const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-file-example': enUS },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider
      runtime={runtime}
      namespace='@nocobase/app-plugin-file-example'
    >
      {children}
    </TestI18nProvider>
  );
}

async function loadPage(name: string): Promise<() => ReactElement> {
  const contribution = fileRepository().routes.find(
    (route) => route.parent === 'app',
  );
  const roots = contribution?.routes as readonly RouteNode[] | undefined;
  const route = roots?.[0]?.children?.find((child) => child.name === name);
  if (!route?.componentLoader) throw new Error(`Missing route: ${name}`);
  return (await route.componentLoader()).default;
}

interface StoredFile {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
  readonly contentUrl: string;
  profileId: string | null;
  orderId: string | null;
}

function createFileRepository(records: StoredFile[]) {
  let sequence = 0;
  const create = (file: File): StoredFile => {
    sequence += 1;
    return {
      id: `file-${sequence}`,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      contentUrl: `/main/uploads/example/${file.name}`,
      profileId: null,
      orderId: null,
    };
  };
  return {
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
    deleteOne: vi.fn(() => Promise.resolve({ deleted: true })),
  };
}

describe('one-to-one profile avatars page', () => {
  it('connects an uploaded avatar and disconnects it again', async () => {
    const files: StoredFile[] = [];
    const avatars = createFileRepository(files);
    state.manager = { repository: vi.fn(() => avatars) };
    const profiles = {
      findMany: vi.fn(() =>
        Promise.resolve([
          { id: 'profile-ada', name: 'Ada Chen', jobTitle: 'Designer' },
        ]),
      ),
      updateOne: vi.fn(
        ({
          filter,
          values,
        }: {
          filter: { id: string };
          values: {
            avatar: { connect?: { id: string }; disconnect?: true };
          };
        }) => {
          const file = files.find(
            (item) => item.id === values.avatar.connect?.id,
          );
          if (file) file.profileId = filter.id;
          if (values.avatar.disconnect)
            for (const item of files) item.profileId = null;
          return Promise.resolve({ record: {}, createdTargets: [] });
        },
      ),
    };
    state.api = {
      repository: vi.fn(() => profiles),
    };
    const Page = await loadPage('file-repository-profile-avatars');
    render(<Page />, { wrapper: I18n });
    await screen.findByText('Ada Chen');
    expect(screen.getByText('No avatar')).toBeTruthy();

    const avatar = new File(['avatar'], 'ada.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload avatar'), {
      target: { files: [avatar] },
    });
    await waitFor(() =>
      expect(avatars.uploadOne).toHaveBeenCalledWith({ file: avatar }),
    );
    await waitFor(() =>
      expect(profiles.updateOne).toHaveBeenCalledWith({
        filter: { id: 'profile-ada' },
        values: { avatar: { connect: { id: 'file-1' } } },
      }),
    );
    await screen.findByText('ada.png');
    expect(screen.getByText('Remove avatar')).toBeTruthy();

    fireEvent.click(screen.getByText('Remove avatar'));
    await waitFor(() =>
      expect(profiles.updateOne).toHaveBeenCalledWith({
        filter: { id: 'profile-ada' },
        values: { avatar: { disconnect: true } },
      }),
    );
    await screen.findByText('No avatar');
  });
});

describe('one-to-many order attachments page', () => {
  it('connects a batch of attachments and detaches one of them', async () => {
    const files: StoredFile[] = [];
    const attachments = createFileRepository(files);
    state.manager = { repository: vi.fn(() => attachments) };
    const orders = {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'order-2401',
            number: 'SO-2026-2401',
            customerName: 'Aurora Studio',
            status: 'submitted',
            amountCents: 128000,
          },
        ]),
      ),
      updateOne: vi.fn(
        ({
          filter,
          values,
        }: {
          filter: { id: string };
          values: {
            attachments: {
              connect?: readonly { id: string }[];
              disconnect?: readonly { id: string }[];
            };
          };
        }) => {
          for (const target of values.attachments.connect ?? []) {
            const file = files.find((item) => item.id === target.id);
            if (file) file.orderId = filter.id;
          }
          for (const target of values.attachments.disconnect ?? []) {
            const file = files.find((item) => item.id === target.id);
            if (file) file.orderId = null;
          }
          return Promise.resolve({ record: {}, createdTargets: [] });
        },
      ),
    };
    state.api = { repository: vi.fn(() => orders) };
    const Page = await loadPage('file-repository-order-attachments');
    render(<Page />, { wrapper: I18n });
    await screen.findByText('SO-2026-2401');
    expect(screen.getByText('No attachments on this order.')).toBeTruthy();

    const contract = new File(['contract'], 'contract.pdf', {
      type: 'application/pdf',
    });
    const receipt = new File(['receipt'], 'receipt.png', {
      type: 'image/png',
    });
    fireEvent.change(screen.getByLabelText('Choose files'), {
      target: { files: [contract, receipt] },
    });
    await waitFor(() =>
      expect(attachments.uploadMany).toHaveBeenCalledWith({
        files: [contract, receipt],
      }),
    );
    await waitFor(() =>
      expect(orders.updateOne).toHaveBeenCalledWith({
        filter: { id: 'order-2401' },
        values: {
          attachments: { connect: [{ id: 'file-1' }, { id: 'file-2' }] },
        },
      }),
    );
    await screen.findByText('contract.pdf');
    expect(screen.getByText('receipt.png')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove from order: contract.pdf' }),
    );
    await waitFor(() =>
      expect(orders.updateOne).toHaveBeenCalledWith({
        filter: { id: 'order-2401' },
        values: { attachments: { disconnect: [{ id: 'file-1' }] } },
      }),
    );
    await waitFor(() => expect(screen.queryByText('contract.pdf')).toBeNull());
    expect(screen.getByText('receipt.png')).toBeTruthy();
  });
});

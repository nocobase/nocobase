import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MailPreferencesService } from '../../server/services/preferences.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type { MailStore } from '../../server/types.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

describe('mail preferences persistence and ownership', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let service: MailPreferencesService;
  const owner = { actorId: 'alice' };
  const other = { actorId: 'bob' };

  beforeEach(async () => {
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    service = new MailPreferencesService({ store });
    for (const userId of ['alice', 'bob']) {
      await store.saveAccount({
        id: userId,
        userId,
        provider: { type: 'test', name: 'test' },
        address: `${userId}@example.com`,
        credentialReference: userId,
        scopes: [],
        status: 'active',
      });
      await store.replaceIdentities(userId, [
        {
          id: `${userId}-identity`,
          accountId: userId,
          address: `${userId}@example.com`,
          isPrimary: true,
          canSend: true,
        },
      ]);
    }
  });
  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  it('persists template creation, sorted listing, updates and deletion across service instances', async () => {
    const created = await service.saveTemplate(owner, {
      name: ' Zeta ',
      subject: 'Hello',
      text: 'Original',
      html: '<p>Original</p>',
    });
    await service.saveTemplate(owner, { name: 'Alpha', subject: 'A' });
    const reopened = new MailPreferencesService({
      store: createDatabaseMailStore(database),
    });
    expect(
      (await reopened.listTemplates(owner)).map((item) => item.name),
    ).toEqual(['Alpha', 'Zeta']);
    await reopened.saveTemplate(owner, {
      id: created.id,
      name: 'Updated',
      subject: 'New subject',
      text: 'New body',
    });
    expect(await service.listTemplates(owner)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          name: 'Updated',
          subject: 'New subject',
          text: 'New body',
          html: '',
          ownerId: 'alice',
        }),
      ]),
    );
    await reopened.deleteTemplate(owner, created.id);
    expect(
      (await service.listTemplates(owner)).map((item) => item.name),
    ).toEqual(['Alpha']);
    await expect(service.deleteTemplate(owner, created.id)).rejects.toThrow(
      'not found',
    );
  });

  it('does not reveal, overwrite or delete another user’s template', async () => {
    const template = await service.saveTemplate(owner, {
      name: 'Private',
      subject: 'Secret',
    });
    expect(await service.listTemplates(other)).toEqual([]);
    await expect(
      service.saveTemplate(other, {
        id: template.id,
        name: 'Hijacked',
        subject: 'Changed',
      }),
    ).rejects.toThrow('not found');
    await expect(service.deleteTemplate(other, template.id)).rejects.toThrow(
      'not found',
    );
    expect(await service.listTemplates(owner)).toEqual([template]);
  });

  it('rejects blank names and updates of missing templates without inserting rows', async () => {
    await expect(
      service.saveTemplate(owner, { name: '  ', subject: 'No' }),
    ).rejects.toThrow('name is required');
    await expect(
      service.saveTemplate(owner, {
        id: 'missing',
        name: 'Missing',
        subject: 'No',
      }),
    ).rejects.toThrow('not found');
    expect(await service.listTemplates(owner)).toEqual([]);
  });

  it('leaves new signatures non-default and persists clearing the only default', async () => {
    const created = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Work',
      text: 'Regards',
    });
    expect(created.isDefault).toBe(false);
    await service.saveSignature(owner, { ...created, isDefault: true });
    const edited = await service.saveSignature(owner, {
      id: created.id,
      accountId: 'alice',
      name: 'Work',
      text: 'Updated',
    });
    expect(edited.isDefault).toBe(true);
    await service.saveSignature(owner, { ...edited, isDefault: false });
    const reopened = new MailPreferencesService({
      store: createDatabaseMailStore(database),
    });
    expect(await reopened.listSignatures(owner, 'alice')).toEqual([
      expect.objectContaining({ id: created.id, isDefault: false }),
    ]);
  });

  it('switches the default signature and promotes a remaining signature after deletion', async () => {
    const first = await service.saveSignature(owner, {
      accountId: 'alice',
      name: ' First ',
      text: 'First',
    });
    const second = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Second',
      text: 'Second',
      isDefault: true,
    });
    expect(await service.listSignatures(owner, 'alice')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: first.id,
          name: 'First',
          isDefault: false,
        }),
        expect.objectContaining({ id: second.id, isDefault: true }),
      ]),
    );
    await service.deleteSignature(owner, 'alice', second.id);
    expect(await service.listSignatures(owner, 'alice')).toEqual([
      expect.objectContaining({ id: first.id, isDefault: true }),
    ]);
    await service.deleteSignature(owner, 'alice', first.id);
    expect(await service.listSignatures(owner, 'alice')).toEqual([]);
  });

  it('preserves signature order when switching the default and reopening the service', async () => {
    const first = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Alpha',
      text: 'First',
    });
    const second = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Zeta',
      text: 'Second',
    });
    const before = await service.listSignatures(owner, 'alice');
    expect(before.map((signature) => signature.id)).toEqual([
      first.id,
      second.id,
    ]);

    await service.saveSignature(owner, { ...second, isDefault: true });
    const after = await service.listSignatures(owner, 'alice');
    expect(after.map((signature) => signature.id)).toEqual(
      before.map((signature) => signature.id),
    );
    expect(after.map((signature) => signature.isDefault)).toEqual([
      false,
      true,
    ]);

    const reopened = new MailPreferencesService({
      store: createDatabaseMailStore(database),
    });
    expect(await reopened.listSignatures(owner, 'alice')).toEqual(after);
  });

  it('rejects cross-account signature edits, deletes and identity changes', async () => {
    const signature = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Private',
      text: 'Signature',
    });
    await expect(service.listSignatures(other, 'alice')).rejects.toThrow(
      'not found',
    );
    await expect(
      service.saveSignature(other, {
        id: signature.id,
        accountId: 'bob',
        name: 'Stolen',
        text: '',
      }),
    ).rejects.toThrow('not found');
    await expect(
      service.deleteSignature(other, 'bob', signature.id),
    ).rejects.toThrow('not found');
    await expect(
      service.updateIdentity(other, {
        accountId: 'alice',
        identityId: 'alice-identity',
        displayName: 'Wrong',
      }),
    ).rejects.toThrow('not found');
    await expect(
      service.updateIdentity(owner, {
        accountId: 'alice',
        identityId: 'bob-identity',
        displayName: 'Wrong',
      }),
    ).rejects.toThrow('not found');
    expect(await service.listSignatures(owner, 'alice')).toEqual([signature]);
    await service.updateIdentity(owner, {
      accountId: 'alice',
      identityId: 'alice-identity',
      displayName: 'Alice',
    });
    expect(await service.listIdentities(owner, 'alice')).toEqual([
      expect.objectContaining({ displayName: 'Alice' }),
    ]);
    await service.updateIdentity(owner, {
      accountId: 'alice',
      identityId: 'alice-identity',
      displayName: null,
    });
    expect(
      (await service.listIdentities(owner, 'alice'))[0].displayName,
    ).toBeUndefined();
  });

  it('enforces owner-scoped unique label names and preserves data after rejected mutations', async () => {
    const label = await service.createLabel(owner, {
      name: ' Work ',
      color: 'blue',
    });
    await service.createLabel(other, { name: 'Work', color: 'red' });
    const second = await service.createLabel(owner, {
      name: 'Personal',
      color: 'green',
    });
    await expect(service.createLabel(owner, { name: 'Work' })).rejects.toThrow(
      'already in use',
    );
    await expect(
      service.updateLabel(owner, { id: second.id, name: 'Work' }),
    ).rejects.toThrow('already in use');
    await expect(
      service.updateLabel(other, { id: label.id, name: 'Stolen' }),
    ).rejects.toThrow('not found');
    await expect(service.deleteLabel(other, label.id)).rejects.toThrow(
      'not found',
    );
    await service.updateLabel(owner, { id: label.id, name: ' Renamed ' });
    expect(await service.listLabels(owner)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: label.id,
          name: 'Renamed',
          color: 'blue',
        }),
      ]),
    );
    await service.deleteLabel(owner, label.id);
    expect(await service.listLabels(owner)).toEqual([second]);
    expect(await service.listLabels(other)).toHaveLength(1);
  });

  it('keeps every field a partial update omits', async () => {
    const template = await service.saveTemplate(owner, {
      name: 'Welcome',
      subject: 'Hello',
      text: 'Plain body',
      html: '<p>Body</p>',
    });
    await expect(
      service.updateTemplate(owner, { id: template.id, subject: 'Hi' }),
    ).resolves.toMatchObject({
      name: 'Welcome',
      subject: 'Hi',
      text: 'Plain body',
      html: '<p>Body</p>',
    });
    await expect(
      service.updateTemplate(other, { id: template.id, name: 'Stolen' }),
    ).rejects.toMatchObject({ reason: 'MAIL_TEMPLATE_NOT_FOUND' });
    await expect(
      service.updateTemplate(owner, { id: template.id, name: ' ' }),
    ).rejects.toMatchObject({
      status: 'INVALID_ARGUMENT',
      reason: 'INVALID_MAIL_REQUEST',
      field: 'name',
    });

    const signature = await service.saveSignature(owner, {
      accountId: 'alice',
      name: 'Formal',
      text: 'Regards',
      html: '<p>Regards</p>',
    });
    await expect(
      service.updateSignature(owner, {
        id: signature.id,
        accountId: 'alice',
        isDefault: true,
      }),
    ).resolves.toMatchObject({
      name: 'Formal',
      text: 'Regards',
      html: '<p>Regards</p>',
      isDefault: true,
    });
    await expect(
      service.updateSignature(owner, {
        id: signature.id,
        accountId: 'alice',
        html: null,
      }),
    ).resolves.toMatchObject({
      name: 'Formal',
      text: 'Regards',
      html: undefined,
    });

    const label = await service.createLabel(owner, {
      name: 'Work',
      color: 'blue',
    });
    await expect(
      service.updateLabel(owner, { id: label.id, color: 'red' }),
    ).resolves.toMatchObject({ name: 'Work', color: 'red' });
    await expect(
      service.updateLabel(owner, { id: label.id, name: 'Office' }),
    ).resolves.toMatchObject({ name: 'Office', color: 'red' });
  });
});

import { expect, it, vi } from 'vitest';
import { UsersProvider } from '../server/providers/users.js';
import { InvitationWork } from '../server/invitations/lifecycle.js';

it('observes invitation bookkeeping before reporting a synchronous sender close failure', async () => {
  const work = new InvitationWork();
  const bookkeeping = Promise.withResolvers<void>();
  const operation = work.run(() => bookkeeping.promise);
  const failure = new Error('Sender close failed');
  const close = vi.fn(() => {
    throw failure;
  });
  const release = vi.fn();
  const provider = Object.assign(Object.create(UsersProvider.prototype), {
    invitationWork: work,
    invitationMailer: { close },
    releasePermissionSetScope: release,
  }) as UsersProvider;
  const shutdown = provider.shutdown();
  const observed = shutdown.catch((error: unknown) => error);
  expect(provider.shutdown()).toBe(shutdown);
  await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(release).not.toHaveBeenCalled();
  await expect(work.run(async () => {})).rejects.toThrow('stopping');
  bookkeeping.resolve();
  await operation;
  const error = await observed;
  expect(error).toBeInstanceOf(AggregateError);
  expect((error as AggregateError).errors).toEqual([failure]);
  expect(release).toHaveBeenCalledOnce();
  expect(provider.shutdown()).toBe(shutdown);
});

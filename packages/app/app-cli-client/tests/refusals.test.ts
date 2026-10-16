import { describe, expect, it } from 'vitest';

import { withheldCommand } from '../src/dynamic/index.ts';
import { configureAppCli } from '../src/config.ts';
import { CliManifestSchema } from '../src/dynamic/manifest.ts';
import { failureEnvelope } from '../src/lib/envelope.ts';
import type { CliManifest } from '../src/parse/manifest.ts';

configureAppCli({
  bin: 'nb-studio',
  displayName: 'Studio',
  stateDir: '.nb-studio',
});

const manifest = (permissionReason?: string): CliManifest => ({
  version: 4,
  etag: 'refusal',
  identity: {
    kind: 'run',
    userId: 'actor',
    displayName: 'Worker',
    actingFor: { userId: 'actor', name: 'Test Actor' },
  },
  commands: [],
  withheld: [
    {
      id: 'pr:open',
      summary: 'Open a PR',
      reason: 'action',
      identities: ['person', 'run'],
      action: 'studio.git/open-pr',
      requiredAction: 'pm.issues/edit',
      ...(permissionReason ? { permissionReason } : {}),
    },
  ],
});

describe('refusal evidence', () => {
  it('reads the optional wire fields and reports the base permission and actual identity', () => {
    const read = CliManifestSchema.parse(manifest('ACTOR_LACKS_ACTION'));
    const error = withheldCommand(read, ['pr', 'open'])!;
    expect(error.message).toContain('Test Actor (actor)');
    expect(error.message).toContain('pm.issues/edit');
    const envelope = failureEnvelope('pr open', error);
    expect(envelope.error).toMatchObject({
      code: 'ACTION_REQUIRED',
      details: {
        action: 'studio.git/open-pr',
        requiredAction: 'pm.issues/edit',
        permissionReason: 'ACTOR_LACKS_ACTION',
        actingFor: { userId: 'actor', name: 'Test Actor' },
      },
    });
    expect(envelope.error?.suggestions[0]?.message).toContain(
      'role management permission',
    );
    expect(error.exit).toBe(3);
  });

  it.each([undefined, 'UNKNOWN', 'FUTURE_REASON'])(
    'uses neutral wording for %s, including old servers',
    (reason) => {
      const old = manifest(reason);
      if (!reason) {
        delete (old.identity as { actingFor?: unknown }).actingFor;
        delete (old.withheld![0] as { requiredAction?: string }).requiredAction;
      }
      const error = withheldCommand(CliManifestSchema.parse(old), [
        'pr',
        'open',
      ])!;
      expect(error.message).toContain('reason is unknown');
      expect(error.message).not.toContain('not given');
      expect(error.message).not.toContain('does not hold');
    },
  );

  it.each([
    'AGENT_NOT_GIVEN',
    'NOT_FOR_AGENTS',
    'READ_ONLY_RUN',
    'NO_ACTION_DECLARED',
  ])('keeps %s distinct from identity permissions', (reason) => {
    const error = withheldCommand(manifest(reason), ['pr', 'open'])!;
    expect(error.message).not.toContain('does not hold');
    expect(error.suggestions[0]?.message).not.toContain(
      'role management permission',
    );
    expect(error.details).toMatchObject({ permissionReason: reason });
  });
});

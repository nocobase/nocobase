import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';

describeIntegrationDatabases('capability warnings', (context) => {
  it('downgrades safe unsupported capabilities without failing real DDL', async () => {
    const result = await context.builder.createCollection(
      'capabilityEvents',
      (collection) => {
        if (context.profile.schema.declareSchema) {
          collection.dbSchema(context.profile.schema.defaultSchema);
        }
        collection.increments('id');
        collection.native('ipAddress', context.profile.schema.nativeTextType, {
          db: {
            comment: 'Client IP address',
          },
        });
        collection.string('email');
        collection.unique('email', {
          deferrable: 'deferred',
        });
      },
    );

    expect(
      await context.db.schema.hasTable(context.table('capabilityEvents')),
    ).toBe(true);
    expect(
      await context.db.schema.hasColumn(
        context.table('capabilityEvents'),
        'ip_address',
      ),
    ).toBe(true);

    const schemaSupported =
      !context.profile.schema.declareSchema ||
      context.profile.schema.supportsSchemas;
    const deferrableSupported =
      context.database.connection().capabilities.deferrableConstraints;
    if (schemaSupported && deferrableSupported) {
      expect(result.warnings).toEqual([]);
    } else if (schemaSupported) {
      expect(result.warnings?.map((warning) => warning.code)).toEqual([
        'UNSUPPORTED_DEFERRABLE_CONSTRAINT',
      ]);
    } else {
      expect(result.warnings?.map((warning) => warning.code)).toEqual(
        expect.arrayContaining([
          'UNSUPPORTED_SCHEMA',
          'UNSUPPORTED_DEFERRABLE_CONSTRAINT',
        ]),
      );
    }

    if (context.profile.schema.comments === 'unsupported') {
      expect(result.warnings?.map((warning) => warning.code)).toEqual(
        expect.arrayContaining([
          'UNSUPPORTED_NATIVE_TYPE',
          'UNSUPPORTED_COMMENT',
        ]),
      );
    }
  });

  it('handles partial unique constraints according to dialect capability', async () => {
    const result = await context.builder.createCollection(
      'partialUniqueJobs',
      (collection) => {
        collection.increments('id');
        collection.integer('accountId');
        collection.integer('programId');
        collection.unique(['accountId', 'programId'], {
          name: context.identifier('uk_partial_unique_jobs_account_program'),
          predicate: {
            accountId: { $notNull: true },
          },
        });
      },
    );

    expect(
      await context.db.schema.hasTable(context.table('partialUniqueJobs')),
    ).toBe(true);

    if (!context.database.connection().capabilities.partialIndexes) {
      expect(result.warnings).toEqual([
        expect.objectContaining({
          code: 'UNSUPPORTED_PARTIAL_UNIQUE_CONSTRAINT',
          severity: 'unsafe',
          fallback: 'skip',
        }),
      ]);

      await context.db(context.table('partialUniqueJobs')).insert({
        account_id: 1,
        program_id: 1,
      });
      await expect(
        context.db(context.table('partialUniqueJobs')).insert({
          account_id: 1,
          program_id: 1,
        }),
      ).resolves.toBeDefined();
    } else {
      expect(result.warnings).toEqual([]);

      await context.db(context.table('partialUniqueJobs')).insert({
        account_id: null,
        program_id: 1,
      });
      await context.db(context.table('partialUniqueJobs')).insert({
        account_id: null,
        program_id: 1,
      });
      await context.db(context.table('partialUniqueJobs')).insert({
        account_id: 1,
        program_id: 1,
      });
      await expect(
        context.db(context.table('partialUniqueJobs')).insert({
          account_id: 1,
          program_id: 1,
        }),
      ).rejects.toThrow(/unique|duplicate/i);

      // The constraint exists as a partial unique index, so dropping it drops that index. PostgreSQL refused it
      // as `alter table … drop constraint`.
      await context.builder.dropConstraint(
        'partialUniqueJobs',
        context.identifier('uk_partial_unique_jobs_account_program'),
      );
      await expect(
        context.db(context.table('partialUniqueJobs')).insert({
          account_id: 1,
          program_id: 1,
        }),
      ).resolves.toBeDefined();
    }
  });
});

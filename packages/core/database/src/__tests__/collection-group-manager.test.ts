import { CollectionGroupManager } from '../collection-group-manager';

describe('collection group manager', () => {
  it('should unify duplicator option', async () => {
    expect(CollectionGroupManager.unifyDumpRules('skipped')).toMatchObject({
      group: 'skipped',
    });

    expect(CollectionGroupManager.unifyDumpRules('required')).toMatchObject({
      group: 'required',
    });

    expect(
      CollectionGroupManager.unifyDumpRules({
        required: true,
      }),
    ).toMatchObject({
      group: 'required',
    });

    expect(
      CollectionGroupManager.unifyDumpRules({
        skipped: true,
      }),
    ).toMatchObject({
      group: 'skipped',
    });

    expect(
      CollectionGroupManager.unifyDumpRules({
        group: 'required',
        delayRestore: {},
      }),
    ).toMatchObject({
      group: 'required',
      delayRestore: {},
    });

    expect(
      CollectionGroupManager.unifyDumpRules({
        group: 'logs',
        delayRestore: {},
      }),
    ).toMatchObject({
      group: 'logs',
      delayRestore: {},
    });
  });
});

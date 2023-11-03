import { CollectionGroupManager } from '../collection-group-manager';

describe('collection group manager', () => {
  it('should unify duplicator option', async () => {
    expect(CollectionGroupManager.unifyDuplicatorOption('skip')).toBeUndefined();

    expect(CollectionGroupManager.unifyDuplicatorOption('required')).toMatchObject({
      dataType: 'meta',
    });

    expect(
      CollectionGroupManager.unifyDuplicatorOption({
        dumpable: 'required',
        with: 'test',
      }),
    ).toMatchObject({
      dataType: 'meta',
      with: 'test',
    });

    expect(
      CollectionGroupManager.unifyDuplicatorOption({
        dataType: 'business',
        with: 'test',
      }),
    ).toMatchObject({
      dataType: 'business',
      with: 'test',
    });

    expect(() =>
      CollectionGroupManager.unifyDuplicatorOption({
        dumpable: 'optional',
        with: 'test',
      }),
    ).toThrow('invalid duplicator option');

    expect(() => CollectionGroupManager.unifyDuplicatorOption('optional')).toThrow(
      'optional collection must have dataType specified',
    );
  });
});

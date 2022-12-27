import React from 'react';
import { render } from '@testing-library/react';
import { useCollection } from '../hooks/useCollection';
import { CollectionManagerProvider } from '../CollectionManagerProvider';
import { CollectionProvider } from '../CollectionProvider';
import collectionsData from './collections';

const setup = () => {
  const returnVal = {};
  const ComponentTest = () => {
    const { resource, ...utils } = useCollection();
    Object.assign(returnVal, {
      resource,
      ...utils,
    });

    return null;
  };

  render(
    <CollectionManagerProvider collections={collectionsData}>
      <CollectionProvider name="t_zf5tj2ctfxj">
        <ComponentTest />
      </CollectionProvider>
    </CollectionManagerProvider>,
  );
  return returnVal;
};

describe('useCollection', () => {
  it('fields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.fields.map((v) => v.key);
    expect(data).toEqual([
      'c39dhmibvlz',
      'b5qtockp38u',
      'wmyojhhgyp1',
      'x6ig9kvho93',
      't7x0o3fbi6t',
      '1bxbs2q42um',
      '0oqkv94uv3p',
    ]);
  });
  it('currentFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.currentFields.map((v) => v.key);
    expect(data).toEqual(['c39dhmibvlz', 'b5qtockp38u', 'wmyojhhgyp1', 'x6ig9kvho93', 't7x0o3fbi6t']);
  });
  it('inheritedFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.inheritedFields.map((v) => v.key);
    expect(data).toEqual([
      '1rheavbio9y',
      '2yfiplf01y0',
      'n4g9nc6j29o',
      '2z7ua9nkwao',
      'mzxannhqgqj',
      '1bxbs2q42um',
      '0oqkv94uv3p',
    ]);
  });
});

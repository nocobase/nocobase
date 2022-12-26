import React from 'react';
import { render, act } from '@testing-library/react';
import { useCollectionManager } from '../hooks/useCollectionManager';
import { CollectionManagerProvider } from '../CollectionManagerProvider';
import collectionsData from './collections';
import data from '../../schema-component/antd/calendar/demos/data';

const setup = () => {
  const returnVal = {};
  const ComponentTest = () => {
    const { collections, ...utils } = useCollectionManager();
    Object.assign(returnVal, {
      collections,
      utils,
    });

    return null;
  };

  render(
    <CollectionManagerProvider collections={collectionsData}>
      <ComponentTest />
    </CollectionManagerProvider>,
  );
  return returnVal;
};

describe('useCollectionManger', () => {
  it('getInheritCollections ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getInheritCollections('t_7okpddajfxm');
    expect(data).toEqual(['t_zf5tj2ctfxj', 't_5eg6u82bbnw']);
  });
  it('getChildrenCollections ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getChildrenCollections('t_5eg6u82bbnw').map((v) => v.name);
    expect(data).toEqual(['t_zf5tj2ctfxj', 't_7okpddajfxm']);
  });
  it('getInheritedFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getInheritedFields('t_zf5tj2ctfxj').map((v) => v.key);
    expect(data).toContain('1bxbs2q42um');
  });
  it('getCollectionFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getCollectionFields('t_zf5tj2ctfxj').map((v) => v.key);
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
  it('getCurrentCollectionFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getCurrentCollectionFields('t_zf5tj2ctfxj').map((v) => v.key);
    expect(data).toEqual(['c39dhmibvlz', 'b5qtockp38u', 'wmyojhhgyp1', 'x6ig9kvho93', 't7x0o3fbi6t']);
  });
  it('getParentCollectionFields ', async () => {
    const useCollectionData: any = setup();
    const data = useCollectionData.utils.getParentCollectionFields('t_5eg6u82bbnw', 't_zf5tj2ctfxj').map((v) => v.name);
    expect(data).toEqual(['F1', 'F2']);
  });
});

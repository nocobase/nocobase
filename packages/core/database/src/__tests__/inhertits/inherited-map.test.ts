import InheritanceMap from '../../inherited-map';

describe('InheritedMap', () => {
  it('should setInherits', () => {
    const map = new InheritanceMap();
    map.setInheritance('b', 'a');

    const nodeA = map.getNode('a');
    const nodeB = map.getNode('b');

    expect(nodeA.children.has(nodeB)).toBe(true);
    expect(nodeB.parents.has(nodeA)).toBe(true);

    expect(map.isParentNode('a')).toBe(true);
  });
});

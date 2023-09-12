export function linkNodes(nodes): void {
  const nodesMap = new Map();
  nodes.forEach((item) => nodesMap.set(item.id, item));
  for (const node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }
  }
}

export function isValidFilter(condition) {
  const group = condition.$and || condition.$or;
  if (!group) {
    return false;
  }

  return group.some((item) => {
    if (item.$and || item.$or) {
      return isValidFilter(item);
    }
    const [name] = Object.keys(item);
    if (!name || !item[name]) {
      return false;
    }
    const [op] = Object.keys(item[name]);
    if (!op || typeof item[name][op] === 'undefined') {
      return false;
    }

    return true;
  });
}

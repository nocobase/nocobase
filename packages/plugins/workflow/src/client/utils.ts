export function linkNodes(nodes): void {
  const nodesMap = new Map();
  nodes.forEach(item => nodesMap.set(item.id, item));
  for (let node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }
  }
}

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

export function traverseSchema(schema, fn) {
  fn(schema);
  if (schema.properties) {
    Object.keys(schema.properties).forEach((key) => {
      traverseSchema(schema.properties[key], fn);
    });
  }
}

export function getWorkflowDetailPath(id: string | number) {
  return `/admin/workflow/workflows/${id}`;
}

export function getWorkflowExecutionsPath(id: string | number) {
  return `/admin/workflow/executions/${id}`;
}

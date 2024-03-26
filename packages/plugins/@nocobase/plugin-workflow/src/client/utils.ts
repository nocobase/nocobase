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

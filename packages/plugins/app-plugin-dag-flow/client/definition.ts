import type {
  WorkflowFlatDefinition,
  WorkflowFlatDefinitionNode,
  WorkflowGraphDefinitionNode,
  WorkflowNestedDefinition,
} from './types.js';

export function restoreFromFlatIr(
  ir: WorkflowFlatDefinition,
): WorkflowNestedDefinition {
  const byKey = new Map<string, WorkflowFlatDefinitionNode>(
    ir.nodes.map((node) => [node.key, node]),
  );
  if (byKey.size !== ir.nodes.length)
    throw new Error('Flat IR contains duplicate node keys');
  const children = new Map<string, WorkflowFlatDefinitionNode[]>();
  for (const node of ir.nodes) {
    if (node.upstreamKey !== null && node.branchKey !== null) {
      const key = `${node.upstreamKey}\u0000${node.branchKey}`;
      children.set(key, [...(children.get(key) ?? []), node]);
    }
  }
  const buildBlock = (
    startKey: string | null,
  ): WorkflowGraphDefinitionNode[] => {
    const result: WorkflowGraphDefinitionNode[] = [];
    const seen = new Set<string>();
    let key = startKey;
    while (key !== null) {
      if (seen.has(key))
        throw new Error(`Flat IR contains a cycle at node "${key}"`);
      seen.add(key);
      const node = byKey.get(key);
      if (!node) throw new Error(`Flat IR references missing node "${key}"`);
      const branches: Record<string, WorkflowGraphDefinitionNode[]> = {};
      for (const childKey of [...children.keys()]
        .filter((candidate) => candidate.startsWith(`${key}\u0000`))
        .sort()) {
        const branchKey = childKey.slice(key.length + 1);
        const roots = children.get(childKey) ?? [];
        if (roots.length !== 1)
          throw new Error(
            `Flat IR branch "${key}.${branchKey}" must have exactly one head`,
          );
        branches[branchKey] = buildBlock(roots[0].key);
      }
      result.push({
        key: node.key,
        ...(node.title === undefined ? {} : { title: node.title }),
        ...(node.description === undefined
          ? {}
          : { description: node.description }),
        type: node.type,
        config: node.config,
        ...(Object.keys(branches).length ? { branches } : {}),
      });
      key = node.downstreamKey;
    }
    return result;
  };
  return {
    title: ir.title,
    ...(ir.description === undefined ? {} : { description: ir.description }),
    ...(ir.options === undefined ? {} : { options: ir.options }),
    ...(ir.parameters === undefined ? {} : { parameters: ir.parameters }),
    inputSchema: ir.inputSchema,
    nodes: buildBlock(ir.start),
  };
}

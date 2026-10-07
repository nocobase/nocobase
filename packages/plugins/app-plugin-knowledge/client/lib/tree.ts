/** A space's entries as a tree, and the entries around one. */
import type { KnowledgeDocSummary } from '../../shared/knowledge.js';

export interface TreeNode {
  readonly doc: KnowledgeDocSummary;
  readonly children: readonly TreeNode[];
}

const byOrder = (a: KnowledgeDocSummary, b: KnowledgeDocSummary): number =>
  a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);

/** The entries as a forest, each level in its order; an entry whose parent is not among them is a root. */
export function forest(docs: readonly KnowledgeDocSummary[]): TreeNode[] {
  const ids = new Set(docs.map((doc) => doc.id));
  const below = new Map<string | null, KnowledgeDocSummary[]>();
  for (const doc of docs) {
    const parent = doc.parentId && ids.has(doc.parentId) ? doc.parentId : null;
    below.set(parent, [...(below.get(parent) ?? []), doc]);
  }
  const build = (parent: string | null): TreeNode[] =>
    (below.get(parent) ?? [])
      .slice()
      .sort(byOrder)
      .map((doc) => ({ doc, children: build(doc.id) }));
  return build(null);
}

/** The entries directly under `parentId`, in their order. */
export function childrenOf(
  docs: readonly KnowledgeDocSummary[],
  parentId: string,
): KnowledgeDocSummary[] {
  return docs.filter((doc) => doc.parentId === parentId).sort(byOrder);
}

/** The ids above `id`, its parent first. */
export function ancestorsOf(
  docs: readonly KnowledgeDocSummary[],
  id: string,
): string[] {
  const parents = new Map(docs.map((doc) => [doc.id, doc.parentId]));
  const found: string[] = [];
  let parent = parents.get(id) ?? null;
  while (parent && !found.includes(parent)) {
    found.push(parent);
    parent = parents.get(parent) ?? null;
  }
  return found;
}

import type { SkillService } from '../../core/skills/skill.service.js';
import { skillFilePathProblem } from '../../../shared/skills.js';
import type { OnlineAgentSandboxSkillCatalog } from './types.js';
import { sandboxLimits } from './limits.js';

/** Read current resources once per SDK segment; no resource versions survive preparation. */
export async function loadSkills(
  service: SkillService,
  ids: readonly string[],
  builtinSkills?: OnlineAgentSandboxSkillCatalog,
): Promise<{
  skills: Map<
    string,
    { name: string; description: string; markdown: string; listing: string[] }
  >;
  files: Record<string, string>;
  unreadable: Map<string, string>;
}> {
  const skills = new Map<
    string,
    { name: string; description: string; markdown: string; listing: string[] }
  >();
  const files: Record<string, string> = {};
  const unreadable = new Map<string, string>();
  let bytes = 0;
  const selected = [];
  for (const id of ids) {
    // Selection is a trusted server scope. SkillService has no per-user read/enable policy.
    const builtin = builtinSkills?.get(id);
    const current = builtin ? await builtin() : await service.get(id);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(current.slug) ||
      skills.has(current.slug)
    )
      throw new Error('Invalid or duplicate selected skill slug.');
    bytes += Buffer.byteLength(current.content);
    if (bytes > sandboxLimits.skillBytes)
      throw new Error('Selected skill entry exceeds mount budget.');
    skills.set(current.slug, {
      name: current.name,
      description: current.description,
      markdown: current.content,
      listing: [],
    });
    files['/skills/' + current.slug + '/SKILL.md'] = current.content;
    selected.push(current);
  }
  // Reserve all entry documents before admitting supporting text in stable path order.
  for (const current of selected) {
    const paths = new Set<string>();
    for (const file of [...current.files].sort((a, b) =>
      a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
    )) {
      if (skillFilePathProblem(file.path) || paths.has(file.path))
        throw new Error('Invalid or duplicate skill support path.');
      paths.add(file.path);
      const path = '/skills/' + current.slug + '/' + file.path;
      const size = file.content === null ? 0 : Buffer.byteLength(file.content);
      const reason =
        file.content === null
          ? 'Binary skill file is not readable.'
          : bytes + size > sandboxLimits.skillBytes
            ? 'Skill file exceeds mount budget.'
            : undefined;
      skills
        .get(current.slug)!
        .listing.push(
          file.path + (reason ? ' [unreadable: ' + reason + ']' : ''),
        );
      if (reason) unreadable.set(path, reason);
      else {
        files[path] = file.content!;
        bytes += size;
      }
    }
  }
  return { skills, files, unreadable };
}

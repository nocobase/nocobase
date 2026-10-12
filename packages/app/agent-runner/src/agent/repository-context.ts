// Fixed session launch directories do not discover the current checkout's instructions automatically.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function repositoryContext(
  directories: readonly string[],
): Promise<string> {
  const context: string[] = [];
  for (const dir of [...new Set(directories)]) {
    for (const name of ['AGENTS.md', 'CLAUDE.md']) {
      const file = path.join(dir, name);
      const content = await readFile(file, 'utf8').catch((error) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
          return undefined;
        throw error;
      });
      if (content !== undefined)
        context.push(`Current repository instructions (${file}):\n${content}`);
    }
    for (const folder of ['.agents/skills', '.claude/skills']) {
      const skills = path.join(dir, folder);
      const entries = await readdir(skills).catch((error) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
          return [] as string[];
        throw error;
      });
      if (entries.length > 0)
        context.push(
          `Current repository skills: ${entries
            .sort()
            .map((name) => path.join(skills, name, 'SKILL.md'))
            .join(', ')}. Read a matching SKILL.md before using it.`,
        );
    }
  }
  return context.join('\n\n');
}

// Copies the application's AI Skills into the build.
//
// `tsc` emits only TypeScript, and a Skill is a `SKILL.md`, so nothing else carries these files. They are loaded
// from `<applicationRoot>/ai/skills`, and in a deployment the application root is `dist` — a built
// server resolves its own paths from `dist/server`. Without this step the directory simply is not there, and a
// missing Skill directory is logged at debug level and skipped, so application Skills work in development and
// silently disappear once deployed.
//
// Markdown is copied, not just `SKILL.md`: a Skill may split its detail into a `references/` directory that
// `SKILL.md` links to, and a Skill that arrives without the pages it points at is worse than one that is absent.
// Nothing else travels — tools are registered in code and named by a Skill's frontmatter, so a Skill directory
// contributes no implementation a deployment reads.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = path.resolve(process.env.NOCOBASE_TOOL_ROOT || process.cwd());
const sourceDir = path.resolve(
  process.argv[2] ?? path.join(rootDir, 'ai', 'skills'),
);
const targetDir = path.resolve(
  process.argv[3] ?? path.join(rootDir, 'dist', 'ai', 'skills'),
);

const isMarkdown = (fileName) => fileName.toLowerCase().endsWith('.md');

/** Every Markdown file under `directory`, as paths relative to the scanned root. */
const collect = (directory, relativeTo) => {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...collect(entryPath, relativeTo));
      continue;
    }
    if (entry.isFile() && isMarkdown(entry.name)) {
      found.push(path.relative(relativeTo, entryPath));
    }
  }
  return found;
};

export function copyAISkills({ source = sourceDir, target = targetDir } = {}) {
  // Most applications define no Skills of their own, and `create-app` scaffolds no `ai/`. Nothing to do is the
  // ordinary case, not a misconfiguration.
  if (!fs.existsSync(source)) return 0;

  const markdownFiles = collect(source, source);
  for (const relativePath of markdownFiles) {
    const targetPath = path.join(target, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(path.join(source, relativePath), targetPath);
  }
  return markdownFiles.length;
}

const isEntryPoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntryPoint) {
  const copied = copyAISkills();
  console.log(
    `Copied ${copied} application Skill file${copied === 1 ? '' : 's'} into dist/ai/skills`,
  );
}

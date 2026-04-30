import * as path from 'node:path';
import * as fs from 'node:fs';
import type {
  RspressPlugin,
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/core';

// ── 内部类型 ──────────────────────────────────────────────────────────

interface CrossRef {
  sourceDir: string;
  targetLink: string;
  aliasRoute: string;
}

type SidebarNode = SidebarItem | SidebarGroup | SidebarSectionHeader | SidebarDivider;

// ── 递归收集所有叶子 link（用于跨模块检测）────────────────────────────

function collectLeafLinks(entries: unknown[]): string[] {
  const links: string[] = [];
  for (const entry of entries) {
    const obj = entry as Record<string, unknown>;
    if (typeof obj?.link === 'string' && !Array.isArray(obj.items)) {
      links.push(obj.link as string);
    }
    if (Array.isArray(obj?.items)) {
      links.push(...collectLeafLinks(obj.items as unknown[]));
    }
  }
  return links;
}

/** 从相对路径取顶层模块名：'/api/auth/sub' → '/api' */
function getTopLevelDir(relDir: string): string {
  const parts = relDir.split('/').filter(Boolean);
  return parts.length > 0 ? '/' + parts[0] : '/';
}

// ── 将 _meta.json 条目解析为 Rspress sidebar 格式 ─────────────────────
//
// 完整支持：
//   file, dir(name), dir(items), custom-link(leaf), custom-link(group),
//   section-header, dir-section-header, divider, 纯字符串

function resolveEntries(
  root: string,
  relDir: string,
  entries: unknown[],
  crossRefs: CrossRef[],
  topDir: string,
): SidebarNode[] {
  const result: SidebarNode[] = [];

  for (const entry of entries) {
    // 纯字符串 → 当作 type: "file" 处理
    if (typeof entry === 'string') {
      const route = entry === 'index' ? relDir : relDir + '/' + entry;
      result.push({ text: entry, link: route });
      continue;
    }

    const obj = entry as Record<string, unknown>;
    if (!obj || typeof obj !== 'object') continue;

    const type = obj.type as string | undefined;

    // section-header：带 items 时当可折叠分组，否则当纯文本标题
    if (type === 'section-header') {
      if (Array.isArray(obj.items)) {
        result.push({
          text: (obj.label as string) || '',
          items: resolveEntries(root, relDir, obj.items as unknown[], crossRefs, topDir),
          collapsible: true,
          collapsed: obj.collapsed !== false,
        });
      } else {
        result.push({ sectionHeaderText: (obj.label as string) || '' });
      }
      continue;
    }

    // divider
    if (type === 'divider') {
      const divider: SidebarDivider = { dividerType: obj.dashed ? 'dashed' : 'solid' };
      result.push(divider);
      continue;
    }

    // type: "file" 或 { type: "file", name: "xxx" }
    if (type === 'file' && typeof obj.name === 'string') {
      const route = obj.name === 'index' ? relDir || '/' : relDir + '/' + obj.name;
      const label = typeof obj.label === 'string' ? obj.label : obj.name;
      result.push({ text: label, link: route });
      continue;
    }

    // type: "dir" 带 name（无 items）→ 递归读子目录的 _meta.json
    if (
      (type === 'dir' || type === 'custom-link') &&
      typeof obj.name === 'string' &&
      !Array.isArray(obj.items)
    ) {
      const subDir = relDir + '/' + obj.name;
      const subItems = readSubDirMeta(root, subDir, crossRefs, topDir);
      const label = typeof obj.label === 'string' ? obj.label : obj.name;
      result.push({
        text: label,
        items: subItems,
        collapsible: true,
        collapsed: obj.collapsed === true,
      });
      continue;
    }

    // dir-section-header: 目录展开为平铺的 section header + items
    if (type === 'dir-section-header' && typeof obj.name === 'string') {
      const subDir = relDir + '/' + obj.name;
      const subItems = readSubDirMeta(root, subDir, crossRefs, topDir);
      const label = typeof obj.label === 'string' ? obj.label : obj.name;
      result.push({ sectionHeaderText: label });
      result.push(...subItems);
      continue;
    }

    // custom-link / dir 带 items → 显式分组
    if ((type === 'custom-link' || type === 'dir') && Array.isArray(obj.items)) {
      const group: SidebarGroup = {
        text: (obj.label as string) || '',
        items: resolveEntries(root, relDir, obj.items as unknown[], crossRefs, topDir),
        collapsible: obj.collapsible !== false,
        collapsed: obj.collapsed === true,
      };
      if (typeof obj.link === 'string') {
        group.link = rewriteIfCrossRef(obj.link as string, crossRefs, topDir);
      }
      result.push(group);
      continue;
    }

    // custom-link 叶子节点
    if (type === 'custom-link' && typeof obj.link === 'string') {
      result.push({
        text: (obj.label as string) || '',
        link: rewriteIfCrossRef(obj.link as string, crossRefs, topDir),
      });
      continue;
    }
  }

  return result;
}

/** 读子目录的 _meta.json，不存在则自动发现文件 */
function readSubDirMeta(
  root: string,
  relDir: string,
  crossRefs: CrossRef[],
  topDir: string,
): SidebarNode[] {
  const metaFile = path.join(root, relDir, '_meta.json');
  if (fs.existsSync(metaFile)) {
    const meta: unknown = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
    if (Array.isArray(meta)) {
      return resolveEntries(root, relDir, meta, crossRefs, topDir);
    }
  }
  return autoDiscoverFiles(root, relDir);
}

/** 自动发现目录中的 md/mdx 文件 */
function autoDiscoverFiles(root: string, relDir: string): SidebarNode[] {
  const absDir = path.join(root, relDir);
  if (!fs.existsSync(absDir)) return [];

  const items: SidebarNode[] = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => {
    // index 文件排最前
    if (a.name.startsWith('index.')) return -1;
    if (b.name.startsWith('index.')) return 1;
    return a.name.localeCompare(b.name);
  })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      const name = entry.name.replace(/\.(md|mdx)$/, '');
      const route = name === 'index' ? relDir : relDir + '/' + name;
      items.push({ text: name, link: route });
    }
  }
  return items;
}

/** 如果是跨模块链接则改写为虚拟路由路径，保留 # 锚点 */
function rewriteIfCrossRef(
  link: string,
  crossRefs: CrossRef[],
  topDir: string,
): string {
  const ref = crossRefs.find(
    r => r.sourceDir === topDir && r.targetLink === link,
  );
  if (!ref) return link;
  const hashIndex = link.indexOf('#');
  const hash = hashIndex !== -1 ? link.slice(hashIndex) : '';
  return ref.aliasRoute + hash;
}

// ── canonical 映射表（供 rspress.config.ts 查询）─────────────────────

/**
 * 虚拟路由 → 原始路由的映射表。
 * rspress.config.ts 的 head canonical 函数用它把虚拟路由的 canonical 指向原始页面。
 */
export const crossRefCanonicalMap: Record<string, string> = {};

// ── 插件主体 ──────────────────────────────────────────────────────────

/**
 * 自动扫描 _meta.json 中的跨模块 custom-link，
 * 为目标页面创建虚拟路由并改写侧边栏链接。
 *
 * 完全不修改源文件。通过 themeConfig.sidebar 生成完整侧边栏配置。
 * 只为顶层目录创建 sidebar key（与 Rspress 自动生成行为一致）。
 */
export function pluginCrossRefSidebar(): RspressPlugin {
  let crossRefs: CrossRef[] = [];

  return {
    name: 'cross-ref-sidebar',

    config(config) {
      const root = config.root || path.join(process.cwd(), 'docs');
      crossRefs = [];

      // 1. 扫描所有 _meta.json 检测跨模块引用（以顶层目录为单位判断）
      for (const metaFile of findAllMetaJson(root)) {
        const dir = path.dirname(metaFile);
        // path.relative 在 Windows 上返回反斜杠分隔的路径，必须规范化成 POSIX
        // 风格的 URL 路径，否则下游 getTopLevelDir 按 '/' split 拿到的 topDir
        // 会被污染（如 '/api\cli'），最终生成 '/api\cli/start' 这种带反斜杠
        // 的虚拟路由跟正常路由冲突，rspress 报 routePath ... has already been added。
        const relDir = '/' + path.relative(root, dir).split(path.sep).join('/');
        const topDir = getTopLevelDir(relDir);

        const meta: unknown = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        if (!Array.isArray(meta) || meta.length === 0) continue;

        for (const link of collectLeafLinks(meta)) {
          if (link.startsWith('http://') || link.startsWith('https://')) continue;
          const linkPath = link.split('#')[0];
          if (linkPath !== topDir && !linkPath.startsWith(topDir + '/')) {
            // 避免重复
            if (!crossRefs.some(r => r.sourceDir === topDir && r.targetLink === link)) {
              crossRefs.push({
                sourceDir: topDir,
                targetLink: link,
                aliasRoute: topDir + '/' + path.basename(linkPath),
              });
            }
          }
        }
      }

      // 填充 canonical 映射表（虚拟路由 → 原始路由）
      for (const ref of crossRefs) {
        crossRefCanonicalMap[ref.aliasRoute] = ref.targetLink.split('#')[0];
      }

      if (crossRefs.length === 0) return config;

      // 2. 为所有顶层目录生成 sidebar（设置后 _meta.json 不再生效）
      const sidebar: Sidebar =
        (config.themeConfig?.sidebar as Sidebar) || {};

      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'public') continue;

        const relDir = '/' + entry.name;
        const metaFile = path.join(root, entry.name, '_meta.json');
        let entries: unknown[];

        if (fs.existsSync(metaFile)) {
          const meta: unknown = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
          entries = Array.isArray(meta) ? meta : [];
        } else {
          // 无 _meta.json，自动发现
          entries = [];
        }

        const items = entries.length > 0
          ? resolveEntries(root, relDir, entries, crossRefs, relDir)
          : autoDiscoverFiles(root, relDir);

        // Rspress 默认 sidebar key 不带尾斜杠（如 '/plugin-development'）。
        // 若未来 Rspress 启用 trailingSlash，需改为 sidebar[relDir + '/']。
        sidebar[relDir] = items;
      }

      config.themeConfig = config.themeConfig || {};
      config.themeConfig.sidebar = sidebar;

      // 3. 同步 _nav.json
      const navFile = path.join(root, '_nav.json');
      if (!config.themeConfig.nav && fs.existsSync(navFile)) {
        config.themeConfig.nav = JSON.parse(
          fs.readFileSync(navFile, 'utf-8'),
        );
      }

      return config;
    },

    addPages(config) {
      if (crossRefs.length === 0) return [];

      const root = config.root || path.join(process.cwd(), 'docs');
      // 按语言隔离临时目录，避免并行构建（CI 中多语言同时跑）共用同名文件 cross-ref-N.md
      // 导致后写覆盖先写，使虚拟路由的源内容串到错误的语言。
      const lang = process.env.DOCS_LANG || 'en';
      const tempDir = path.join(process.cwd(), 'node_modules', '.rspress', 'cross-ref', lang);
      fs.mkdirSync(tempDir, { recursive: true });

      return crossRefs
        .map((ref, index) => {
          const linkPath = ref.targetLink.split('#')[0];
          const filepath = resolveSourceFile(root, linkPath);
          if (!filepath) return null;

          const content = fs.readFileSync(filepath, 'utf-8');
          // 写成 .md 而不是让 Rspress 默认写成 .mdx，避免 MDX 严格模式导致 HTML 注释报错
          const tempFile = path.join(tempDir, `cross-ref-${index}.md`);
          fs.writeFileSync(tempFile, content);
          return { routePath: ref.aliasRoute, filepath: tempFile };
        })
        .filter(
          (p): p is { routePath: string; filepath: string } => p !== null,
        );
    },
  };
}

// ── 工具函数 ──────────────────────────────────────────────────────────



function resolveSourceFile(root: string, link: string): string | null {
  for (const ext of ['.md', '.mdx']) {
    const fp = path.join(root, link + ext);
    if (fs.existsSync(fp)) return fp;
  }
  for (const ext of ['.md', '.mdx']) {
    const fp = path.join(root, link, 'index' + ext);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

function findAllMetaJson(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'public' && !entry.name.startsWith('.')) {
      results.push(...findAllMetaJson(full));
    } else if (entry.name === '_meta.json') {
      results.push(full);
    }
  }
  return results;
}

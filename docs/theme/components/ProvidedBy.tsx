import { Badge, Link } from "@rspress/core/theme";
import { useFrontmatter, useLang, usePages } from "@rspress/runtime";
import { transformHref } from "../utils";
import { EditionLevelsTypes, EditionLevels, EditionLevelsEN } from "./EditionLevels";

export function ProvidedBy() {
  const { frontmatter } = useFrontmatter();
  const lang = useLang();
  const { pages } = usePages();
  if (!frontmatter?.pkg) {
    return null;
  }
  const page = pages.find(page => page.lang === lang && page.frontmatter?.packageName === frontmatter?.pkg);
  if (!page) {
    return null;
  }
  const levels = lang === 'cn' ? EditionLevels : EditionLevelsEN;
  const commercialLink = lang === 'cn' ? 'https://www.nocobase.com/cn/commercial' : 'https://www.nocobase.com/en/commercial';
  return (
    <span style={{ display: 'inline-flex', gap: '5px' }}>
      {frontmatter?.pkg && (
        <Badge type="info"><Link target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link></Badge>
      )}
      {page?.frontmatter?.editionLevel >= 0 && (
        <Badge type={EditionLevelsTypes[page?.frontmatter?.editionLevel as number]}><Link target="_blank" href={commercialLink}>{levels[page?.frontmatter?.editionLevel as number]}+</Link></Badge>
      )}
    </span>
  );
}

import { Badge, Link } from "@rspress/core/theme";
import { useFrontmatter, useLang, usePages } from "@rspress/runtime";
import { transformHref } from "../utils";
import { EditionLevels, EditionLevelsEN } from "./EditionLevels";

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
  return lang === 'cn' ? (
    <>
      {page?.frontmatter?.isFree && (
        <Badge type="info">该功能由插件 «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>» 提供</Badge>
      )}
      {page?.frontmatter?.editionLevel && (
        <Badge type="danger">该功能由插件 «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>» 提供，
          包含在 <Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/en/commercial">{EditionLevels[page?.frontmatter?.editionLevel as number]}</Link> 及以上商业版本中</Badge>
      )}
      {(page?.frontmatter?.points as number) > 0 && (
        <Badge type="danger">该功能由商业插件 «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>» 提供，
          请 <Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/en/plugins">购买</Link> 后使用</Badge>
      )}
    </>
  ) : (
    <>
      {page?.frontmatter?.isFree && (
        <Badge type="info">This feature is provided by the plugin «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>»</Badge>
      )}
      {page?.frontmatter?.editionLevel && (
        <Badge type="danger">This feature is provided by the plugin «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>», included in <Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/en/commercial">{EditionLevelsEN[page?.frontmatter?.editionLevel as number]}</Link> and above commercial editions</Badge>
      )}
      {(page?.frontmatter?.points as number) > 0 && (
        <Badge type="danger">This feature is provided by the commercial plugin «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>»,
          please <Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/en/plugins">purchase</Link> to use</Badge>
      )}
    </>
  );
}

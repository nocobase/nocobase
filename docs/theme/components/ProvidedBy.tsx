import { Badge, Link } from "@rspress/core/theme";
import { useLang, useFrontmatter, usePages } from "@rspress/runtime";
import { transformHref } from "../utils";

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
      {page?.frontmatter?.isFree ? (
        <Badge type="info">该功能由插件 «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>» 提供</Badge>
      ) : (
        <Badge type="danger">该功能由商业插件 «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>» 提供，
          请查看<Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/cn/plugins">商业授权</Link>了解详情</Badge>
      )}
    </>
  ) : (
    <>
      {page?.frontmatter?.isFree ? (
        <Badge type="info">This feature is provided by the plugin «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>»</Badge>
      ) : (
        <Badge type="danger">This feature is provided by the commercial plugin «<Link style={{ textDecoration: 'underline' }} target="_blank" href={transformHref(`/plugins/${frontmatter?.pkg}`, lang)}>{page?.frontmatter?.displayName as string}</Link>»,
          please see <Link style={{ textDecoration: 'underline' }} target="_blank" href="https://www.nocobase.com/plugins">Commercial License</Link> for details</Badge>
      )}
    </>
  );
}

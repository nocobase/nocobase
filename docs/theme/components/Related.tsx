import { Link } from "@rspress/core/theme";
import { usePages } from "@rspress/runtime";

export function Related(props: { pkg: string }) {
  const { pages } = usePages();
  const page = pages.find(page => page.frontmatter?.pkg === props.pkg);
  if (!page) {
    return null;
  }
  return (
    <>
      <h2>Related</h2>
      {pages.filter(page => page.frontmatter?.pkg === props.pkg).map(page => {
        return (
          <ul>
            <li><Link href={page.routePath}>{page.title}</Link></li>
          </ul>
        )
      })}
    </>
  );
}

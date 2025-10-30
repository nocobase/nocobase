import { Badge, Link } from "@rspress/core/theme";
import { useFrontmatter } from "@rspress/runtime";

export function ProvidedBy() {
  const { frontmatter } = useFrontmatter();
  if (!frontmatter?.pkg) {
    return null;
  }
  return (
    <>
      <Badge type="tip">该功能由「<Link href="/plugins/@nocobase/plugin-ai">AI 员工</Link>」插件提供</Badge>
      {/* <div className="rspress-directive tip">
        <div className="rspress-directive-title">提示</div>
        <div className="rspress-directive-content">
          <p>该功能由「<Link target="_blank" href="/plugins/@nocobase/plugin-ai">AI 员工</Link>」插件提供。</p>
        </div>
      </div> */}
    </>
  );
}

import { Badge } from '@rspress/core/theme';
import { Link, useFrontmatter } from "@rspress/runtime";
import { PluginPrice } from './PluginPrice';
import { EditionLevels } from './EditionLevels';

export type PluginInfoFrontmatter = {
  displayName?: string;
  packageName: string;
  supportedVersions: string[];
  defaultInstalled: boolean;
  isFree?: boolean;
  points?: number;
  editionLevel: number;
  description?: string;
};

const trStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
}

const tdStyle: React.CSSProperties = {
  borderColor: 'var(--rp-c-divider-light)',
  padding: "4px 8px",
  // fontWeight: 500,
};

const firstTdStyle: React.CSSProperties = {
  ...tdStyle,
  backgroundColor: 'var(--rp-c-bg-soft)',
  width: "150px",
};

export function PluginInfo() {
  const { frontmatter } = useFrontmatter() as { frontmatter: PluginInfoFrontmatter };

  if (!frontmatter?.displayName) {
    return null;
  }

  return (
    <>
      <p>{frontmatter.description}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr style={trStyle}>
            <td style={firstTdStyle}>包名</td>
            <td style={tdStyle}><code>{frontmatter.packageName}</code></td>
          </tr>
          <tr style={trStyle}>
            <td style={firstTdStyle}>支持版本</td>
            <td style={tdStyle}>
              <div style={{ display: 'inline-flex', gap: "4px" }}>
                {frontmatter.supportedVersions.map(v => <Badge key={v}>{v}</Badge>)}
              </div>
            </td>
          </tr>
          <tr style={trStyle}>
            <td style={firstTdStyle}>默认安装</td>
            <td style={tdStyle}>
              {frontmatter.defaultInstalled ? <Badge>是</Badge> : <Badge>否</Badge>}
              {!frontmatter.defaultInstalled && (
                <Link style={{ marginLeft: 4, fontSize: "14px" }} className="rp-link" to="#">如何安装插件？</Link>
              )}
            </td>
          </tr>
          {frontmatter.isFree && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>定价</td>
              <td style={tdStyle}><Badge>免费</Badge></td>
            </tr>
          )}
          {frontmatter.points && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>定价</td>
              <td style={tdStyle}><PluginPrice /></td>
            </tr>
          )}
          {frontmatter.editionLevel && Number(frontmatter.editionLevel) > 0 && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>定价</td>
              <td style={tdStyle}>
                <div style={{ display: "inline-flex", gap: "2px" }}>
                  <span>包含于</span>
                  {EditionLevels.map((e, index) => {
                    if (index < frontmatter.editionLevel) {
                      return null;
                    }
                    return <a target="_blank" href="https://www.nocobase.com/cn/commercial" style={{ textDecoration: 'none' }}><Badge key={e}>{e}</Badge></a>;
                  })}
                </div>
              </td>
            </tr>
          )}
          {/* <tr>
            <td style={firstTdStyle}>描述</td>
            <td style={tdStyle}>
              {frontmatter.description}
            </td>
          </tr> */}
        </tbody>
      </table>
      {/* <p>{frontmatter.description}</p> */}
    </>
  );
}
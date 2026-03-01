import { Badge } from '@rspress/core/theme';
import { Link, useFrontmatter } from "@rspress/runtime";
import { transformHref, useLangPrefix } from '../utils';
import { EditionLevels, EditionLevelsEN, EditionLevelsTypes } from './EditionLevels';
import { Related } from './Related';

export type PluginInfoFrontmatter = {
  displayName?: string;
  packageName: string;
  supportedVersions: string[];
  defaultEnabled: boolean;
  builtIn: boolean;
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
  width: "200px",
};

export function PluginInfo() {
  const { frontmatter } = useFrontmatter() as { frontmatter: PluginInfoFrontmatter };
  const lang = useLangPrefix();
  if (!frontmatter?.displayName) {
    return null;
  }

  return (
    <>
      <p>{frontmatter.description}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr style={trStyle}>
            <td style={firstTdStyle}>Package name</td>
            <td style={tdStyle}><code>{frontmatter.packageName}</code></td>
          </tr>
          {frontmatter.supportedVersions && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>Supported versions</td>
              <td style={tdStyle}>
                {frontmatter.supportedVersions.map(v => <code style={{ marginRight: 4 }} key={v}>{v}</code>)}
              </td>
            </tr>
          )}
          <tr style={trStyle}>
            <td style={firstTdStyle}>Built-in</td>
            <td style={tdStyle}>
              {frontmatter.builtIn ? <code>Yes</code> : <code>No</code>}
              {!frontmatter.builtIn && (
                <Link target="_blank" style={{ marginLeft: 4, fontSize: "14px" }} className="rp-link" to={transformHref(`/get-started/install-upgrade-plugins`, lang)}>
                  How to install plugins?
                </Link>
              )}
            </td>
          </tr>
          <tr style={trStyle}>
            <td style={firstTdStyle}>Default enabled</td>
            <td style={tdStyle}>
              {frontmatter.defaultEnabled ? <code>Yes</code> : <code>No</code>}
            </td>
          </tr>
          {/* {frontmatter.isFree && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>Pricing</td>
              <td style={tdStyle}><Badge>Free</Badge></td>
            </tr>
          )} */}
          {/* {frontmatter.points && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>Pricing</td>
              <td style={tdStyle}><PluginPrice points={Number(frontmatter.points)} /></td>
            </tr>
          )} */}
          {Number(frontmatter.editionLevel) >= 0 && (
            <tr style={trStyle}>
              <td style={firstTdStyle}>Edition</td>
              <td style={tdStyle}>
                <div style={{ display: "inline-flex", gap: "2px" }}>
                  <Badge type={EditionLevelsTypes[frontmatter.editionLevel as number] as 'tip'}>
                    {lang === 'cn' ? EditionLevels[frontmatter.editionLevel] : EditionLevelsEN[frontmatter.editionLevel]}+
                  </Badge>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Related pkg={frontmatter.packageName} />
      {/* <p>{frontmatter.description}</p> */}
    </>
  );
}
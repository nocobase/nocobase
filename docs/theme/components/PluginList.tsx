import { useFrontmatter, useLang, useNavigate, usePageData } from '@rspress/core/runtime';
import { PluginCard } from './PluginCard';
import { PluginPrice } from './PluginPrice';
import { type PluginInfoFrontmatter } from './PluginInfo';
import { EditionLevels } from './EditionLevels';
import { Badge, renderHtmlOrText } from '@rspress/core/theme';
import './PluginList.scss';

export function PluginList() {
  const { siteData } = usePageData();
  const lang = useLang();
  const { frontmatter } = useFrontmatter();

  return frontmatter?.isPluginPage ? (
    <>
      <div className="rp-home-feature-container">
        <h2 className="rp-home-feature-header">{frontmatter.title}</h2>
        <p className="rp-home-feature-desc">{frontmatter.description}</p>
      </div>
      <div className="rp-home-feature rp-plugin-list">
        {siteData.pages.filter(page => !page.frontmatter?.deprecated && page.frontmatter?.packageName && page.lang === lang && page.routePath.includes('/plugins/')).map(page => {
          return <PluginCard
            float={true}
            name={page.frontmatter.displayName as string}
            description={page.frontmatter.description as string}
            detailLink={page.routePath}
            isFree={page.frontmatter.isFree as boolean}
            editionLevel={page.frontmatter.editionLevel as number}
            supportedVersions={page.frontmatter.supportedVersions as string[]}
            pricing={page.frontmatter.points ? {
              plan1: {
                label: '永久使用, 1 年升级',
                points: 1 * (page.frontmatter.points as number),
                price: 1 * (page.frontmatter.points as number) * 300,
              },
              plan2: {
                label: '永久使用和升级',
                points: 2 * (page.frontmatter.points as number),
                price: 2 * (page.frontmatter.points as number) * 300,
              }
            }: undefined}
          />

          // <CardItem
          //   key={page.routePath}
          //   page={page as any}
          // />
        })}
        {/* <Tabs>
        <Tab label="免费插件">
          <table>
            <tr>
              <th>插件名</th>
              <th>包名</th>
              <th>描述</th>
              <th>默认安装</th>
            </tr>
            {siteData.pages.filter(page => page.frontmatter?.packageName && page.lang === lang && page.routePath.includes('/plugins/')).map(page => {
              return <tr>
                <td>{page.frontmatter.displayName as string}</td>
                <td>{page.frontmatter.packageName as string}</td>
                <td>{page.frontmatter.description as string}</td>
                <td>{page.frontmatter.defaultInstalled ? <Badge>是</Badge> : <Badge>否</Badge>}</td>
              </tr>
            })}
          </table>
        </Tab>
        <Tab label="许可证版本插件">
          <table>
            <tr>
              <th>插件名</th>
              <th>包名</th>
              <th>描述</th>
              <th>许可证版本</th>
              <th>默认安装</th>
            </tr>
            {siteData.pages.filter(page => page.frontmatter?.editionLevel && page.lang === lang && page.routePath.includes('/plugins/')).map(page => {
              return <tr>
                <td>{page.frontmatter.displayName as string}</td>
                <td>{page.frontmatter.packageName as string}</td>
                <td>{page.frontmatter.description as string}</td>
                <td><Pricing frontmatter={page.frontmatter as PluginInfoFrontmatter} /></td>
                <td>{page.frontmatter.defaultInstalled ? <Badge>是</Badge> : <Badge>否</Badge>}</td>
              </tr>
            })}
          </table>


        </Tab>
        <Tab label="商业插件">
          <table>
            <tr>
              <th>插件名</th>
              <th>包名</th>
              <th>描述</th>
              <th>定价（1 年升级）</th>
              <th>定价（永久升级）</th>
              <th>默认安装</th>
            </tr>
            {siteData.pages.filter(page => page.frontmatter?.points && page.lang === lang && page.routePath.includes('/plugins/')).map(page => {
              return <tr>
                <td>{page.frontmatter.displayName as string}</td>
                <td>{page.frontmatter.packageName as string}</td>
                <td>{page.frontmatter.description as string}</td>
                <td>{page.frontmatter.points as number}</td>
                <td>{2 * (page.frontmatter.points as number)}</td>
                <td>{page.frontmatter.defaultInstalled ? <Badge>是</Badge> : <Badge>否</Badge>}</td>
              </tr>
            })}
          </table>
        </Tab>
      </Tabs> */}
      </div>
    </>
  ) : null;
}

export function Pricing({ frontmatter }: { frontmatter: PluginInfoFrontmatter }) {
  return (
    <>
      {frontmatter.isFree && (
        <Badge>Free</Badge>
      )}
      {frontmatter.points && (
        <PluginPrice />
      )}
      {frontmatter.editionLevel && Number(frontmatter.editionLevel) > 0 && (
        <a target="_blank" href="https://www.nocobase.com/cn/commercial" style={{ textDecoration: 'none' }}><Badge type="info">{EditionLevels[frontmatter.editionLevel]}+</Badge></a>
      )}
    </>
  );
}

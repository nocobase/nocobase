import { useFrontmatter, useLang, useNavigate, usePages } from '@rspress/core/runtime';
import { PluginCard } from './PluginCard';
import { PluginPrice } from './PluginPrice';
import { type PluginInfoFrontmatter } from './PluginInfo';
import { EditionLevels } from './EditionLevels';
import { Badge, renderHtmlOrText } from '@rspress/core/theme';
import './PluginList.scss';

export function PluginList() {
  const { pages } = usePages();
  const lang = useLang();
  const { frontmatter } = useFrontmatter();

  return frontmatter?.isPluginPage ? (
    <>
      <div className="rp-home-feature-container">
        <h2 className="rp-home-feature-header">{frontmatter.title}</h2>
        <p className="rp-home-feature-desc">{frontmatter.description}</p>
      </div>
      <div className="rp-home-feature rp-plugin-list">
        {pages.filter(page => !page.frontmatter?.deprecated && page.frontmatter?.packageName && page.lang === lang && page.routePath.includes('/plugins/')).map(page => {
          const points = Number(page.frontmatter.points as number);
          return <PluginCard
            float={true}
            name={page.frontmatter.displayName as string}
            description={page.frontmatter.description as string}
            detailLink={page.routePath}
            isFree={page.frontmatter.isFree as boolean}
            editionLevel={page.frontmatter.editionLevel as number}
            supportedVersions={page.frontmatter.supportedVersions as string[]}
            pricing={points > 0 ? {
              plan1: {
                label: lang === 'cn' ? '永久使用, 1 年升级' : 'Lifetime use, 1-year upgrade',
                points: 1 * points,
                price: 1 * points * (lang === 'cn' ? 300 : 50),
              },
              plan2: {
                label: lang === 'cn' ? '永久使用和升级' : 'Lifetime use & upgrade',
                points: 2 * points,
                price: 2 * points * (lang === 'cn' ? 300 : 50),
              }
            }: undefined}
          />
        })}
      </div>
    </>
  ) : null;
}

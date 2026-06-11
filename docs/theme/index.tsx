import { NoSSR, useFrontmatter, useLang, useNavigate, usePage, usePages } from '@rspress/core/runtime';
import type { Feature } from '@rspress/core';
import { Badge, DocContent, DocLayout as OriginalDocLayout, getCustomMDXComponent as basicGetCustomMDXComponent, Layout as BasicLayout, HomeFooter, Link, renderHtmlOrText, Tab, Tabs } from '@rspress/core/theme-original';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { PluginCard } from './components/PluginCard';
import { PluginInfo } from './components/PluginInfo';
import { PluginList } from './components/PluginList';
import { ProvidedBy } from './components/ProvidedBy';
import './index.scss';
import { transformHref, useLangPrefix } from './utils';
import { HomeHero } from './components/HomeHero';

function getCustomMDXComponent() {
  const { h1: H1, ...mdxComponents } = basicGetCustomMDXComponent();

  const MyH1 = ({ ...props }) => {
    return (
      <>
        <H1 {...props} />
        <LlmsContainer>
          <LlmsCopyButton />
          {/* LlmsViewOptions 组件可根据需要添加  */}
          <LlmsViewOptions />
        </LlmsContainer>
        <PluginInfo />
        <ProvidedBy />
      </>
    );
  };

  return {
    ...mdxComponents,
    h1: MyH1,
    PluginCard,
    Badge,
    Tabs,
    Tab,
    NoSSR,
  };
}

export { getCustomMDXComponent };

export interface HomeLayoutProps {
  beforeHero?: ReactNode;
  afterHero?: ReactNode;
  beforeHeroActions?: ReactNode;
  afterHeroActions?: ReactNode;
  beforeFeatures?: ReactNode;
  afterFeatures?: ReactNode;
}

type HomeFeatureItemData = Feature & {
  showOnHome?: boolean;
};

type HomeFeatureGroup = {
  title?: string;
  details?: string;
  items?: HomeFeatureItemData[];
};

type ThemeFrontmatter = {
  pageName?: string;
  hero?: unknown;
  features?: HomeFeatureGroup[];
  displayName?: string;
  packageName?: string;
};

type ThemePage = {
  lang?: string;
  frontmatter?: ThemeFrontmatter & Record<string, unknown>;
};

function getFeatureGroups(page?: ThemePage | { frontmatter?: ThemeFrontmatter }): HomeFeatureGroup[] {
  return page?.frontmatter?.features ?? [];
}

function isPluginDetailPage(frontmatter?: ThemeFrontmatter, routePath?: string): boolean {
  return Boolean(
    frontmatter?.displayName &&
    frontmatter?.packageName &&
    routePath?.includes('/plugins/@nocobase/'),
  );
}

function isSidebarCenteredLayout(routePath?: string): boolean {
  return routePath === '/api' || routePath === '/api/';
}

export function HomeLayout(props: HomeLayoutProps) {
  const {
    beforeHero,
    afterHero,
    beforeFeatures,
    afterFeatures,
    beforeHeroActions,
    afterHeroActions,
  } = props;
  const {
    page: { frontmatter, routePath },
  } = usePage();

  return (
    <div
      className="rp-relative"
      style={{
        minHeight: 'calc(100vh - var(--rp-nav-height))',
        paddingBottom: '80px',
      }}
    >
      <div className="rp-pb-12">
        {beforeHero}
        {
          frontmatter.hero && (
            <HomeHero
              frontmatter={frontmatter}
              routePath={routePath}
              beforeHeroActions={beforeHeroActions}
              afterHeroActions={afterHeroActions}
            />
          )
        }
        {afterHero}
        {beforeFeatures}
        <HomeFeature />
        <PluginList />
        {afterFeatures}
      </div>
      <HomeFooter />
    </div>
  );
}

const getGridClass = (feature: Feature): string => {
  const { span } = feature;
  switch (span) {
    case 2:
      return 'rp-home-feature__item--span-2';
    case 3:
      return 'rp-home-feature__item--span-3';
    case 4:
      return 'rp-home-feature__item--span-4';
    case 6:
      return 'rp-home-feature__item--span-6';
    case undefined:
      return 'rp-home-feature__item--span-4';
    default:
      return '';
  }
};

export const Layout = () => {
  const {
    page: { routePath },
  } = usePage();
  const { frontmatter } = useFrontmatter() as {
    frontmatter?: {
      displayName?: string;
      packageName?: string;
    };
  };
  const isPluginDetailPage = Boolean(
    frontmatter?.displayName &&
    frontmatter?.packageName &&
    routePath?.startsWith('/plugins/@'),
  );
  const pageClassName = [
    isPluginDetailPage ? 'plugin-detail-page' : '',
    isSidebarCenteredLayout(routePath) ? 'doc-layout-sidebar-centered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={pageClassName || undefined}>
      <BasicLayout
      // beforeNav={
      //   <NoSSR>
      //     <div className="rp-banner">
      //       {
      //         lang === 'en'
      //           ? '🚧 NocoBase 2.0 documentation is incomplete and currently being written'
      //           : '🚧 NocoBase 2.0 文档尚不完整，内容正在编写中'
      //       }
      //     </div>
      //   </NoSSR>
      // }
      />
    </div>
  );
};

export function DocLayout(props: ComponentProps<typeof OriginalDocLayout>) {
  const { page } = usePage();
  const { frontmatter } = useFrontmatter() as { frontmatter?: ThemeFrontmatter };

  if (!isPluginDetailPage(frontmatter, page.routePath)) {
    return <OriginalDocLayout {...props} />;
  }

  const { beforeDoc, afterDoc, components } = props;

  return (
    <>
      {beforeDoc}
      <div className="rp-plugin-detail-layout">
        <main className="rp-plugin-detail-layout__main rp-doc-layout__doc-container">
          <div className="rp-doc rspress-doc">
            <DocContent components={components} />
          </div>
        </main>
      </div>
      {afterDoc}
    </>
  );
}

function HomeFeatureItem({ feature }: { feature: Feature }): JSX.Element {
  const { title, details, link: rawLink } = feature;

  const link = rawLink;
  const navigate = useNavigate();
  const langPrefix = useLangPrefix();

  return (
    <div
      key={title}
      className={`rp-home-feature__item ${getGridClass(feature)}`}
    >
      <div className="rp-home-feature__item-wrapper">
        <article
          key={title}
          className={`rp-home-feature__card ${link ? 'rp-home-feature__card--clickable' : ''}`}
          onClick={() => {
            if (link) {
              navigate(transformHref(link, langPrefix));
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              });
            }
          }}
        >
          <div className="rp-home-feature__title-wrapper">
            <h2 className="rp-home-feature__title">
              {link ? (
                <Link href={transformHref(link, langPrefix)}>{title}</Link>
              ) : title}
            </h2>
          </div>
          <p
            className="rp-home-feature__detail"
            {...renderHtmlOrText(details)}
          ></p>
        </article>
      </div>
    </div>
  );
}

export function HomeFeature() {
  const { frontmatter } = useFrontmatter() as { frontmatter?: ThemeFrontmatter };
  const { pages } = usePages() as { pages: ThemePage[] };
  const lang = useLang();
  const featureGroups = frontmatter?.features ?? [];

  if (frontmatter?.pageName === 'home') {
    return (
      <div>
        {featureGroups.map((feature, index) => {
          let items = feature.items ?? [];

          if (index === 2) {
            const page = pages.find((currentPage) => currentPage.lang === lang && currentPage.frontmatter?.pageName === 'guide');
            if (page) {
              const allItems = getFeatureGroups(page).flatMap((group) => group.items ?? []);
              items = [...allItems.filter((item) => item.showOnHome), ...items];
            }
          } else if (index === 3) {
            const page = pages.find((currentPage) => currentPage.lang === lang && currentPage.frontmatter?.pageName === 'development');
            if (page) {
              // 把 page.frontmatter?.features 里的 items 都拍平合并，取前 8 个
              const allItems = getFeatureGroups(page).flatMap((group) => group.items ?? []);
              items = [...allItems.filter((item) => item.showOnHome), ...(feature.items ?? [])];
            }
          }

          return (
            <div key={feature.title || `feature-${index}`}>
              <div className="rp-home-feature-container">
                <h2 className="rp-home-feature-header">{feature.title}</h2>
                <p className="rp-home-feature-desc">{feature.details}</p>
              </div>
              <div className="rp-home-feature">
                {items.map((item) => {
                  return <HomeFeatureItem key={item.title} feature={item} />;
                })}
              </div>
            </div>
          )
        })}
      </div>
    );
  }

  return (
    <div>
      {featureGroups.map((feature, index) => {
        return (
          <div key={feature.title || `feature-${index}`}>
            <div className="rp-home-feature-container">
              <h2 className="rp-home-feature-header">{feature.title}</h2>
              <p className="rp-home-feature-desc">{feature.details}</p>
            </div>
            <div className="rp-home-feature">
              {(feature.items ?? []).map((item) => {
                return <HomeFeatureItem key={item.title} feature={item} />;
              })}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export { Nav } from './components/Nav';

export * from '@rspress/core/theme-original';

import { NoSSR, useFrontmatter, useLang, useLocation, useNavigate, usePage, usePages } from '@rspress/core/runtime';
import type { Feature } from '@rspress/core';
import { Badge, SwitchAppearance as BaseSwitchAppearance, getCustomMDXComponent as basicGetCustomMDXComponent, Layout as BasicLayout, HomeFooter, HomeHero, Link, renderHtmlOrText, Tab, Tabs } from '@rspress/core/theme-original';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { locales } from '../locales';
import { PluginCard } from './components/PluginCard';
import { PluginInfo } from './components/PluginInfo';
import { PluginList } from './components/PluginList';
import { ProvidedBy } from './components/ProvidedBy';
import './index.scss';
import { transformHref, useLangPrefix } from './utils';

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

interface Language {
  code: string;
  label: string;
  href: string;
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
};

type ThemePage = {
  lang?: string;
  frontmatter?: ThemeFrontmatter & Record<string, unknown>;
};

const LANGUAGES: Language[] = locales;

function getFeatureGroups(page?: ThemePage | { frontmatter?: ThemeFrontmatter }): HomeFeatureGroup[] {
  return page?.frontmatter?.features ?? [];
}

function LanguageDropdown() {
  const lang = useLang();
  const currentLanguage = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const { pathname, search } = useLocation();
  const getLanguageHref = (targetLang: string) => {
    return targetLang === 'en' ? `${pathname}${search}` : `/${targetLang}${pathname}${search}`;
  };

  return (
    <div
      style={{ position: 'relative', zIndex: 1000 }}
      className="language-dropdown translation rp-flex rp-text-sm rp-font-bold rp-items-center rp-px-3 rp-py-2"
    >
      <div>
        <div
          className="rspress-nav-menu-group-button rp-flex rp-justify-center rp-items-center rp-font-medium rp-text-sm rp-text-text-1 hover:rp-text-text-2 rp-transition-colors rp-duration-200 rp-cursor-pointer"
          role="button"
          aria-haspopup="true"
          aria-label="Language selector"
          tabIndex={0}
        >
          <span className="rp-text-sm rp-font-medium rp-flex rp-break-keep" style={{ marginRight: '2px' }}>
            <svg width="18" height="18" viewBox="0 0 32 32" style={{ width: '18px', height: '18px' }}>
              <path
                fill="currentColor"
                d="M27.85 29H30l-6-15h-2.35l-6 15h2.15l1.6-4h6.85zm-7.65-6 2.62-6.56L25.45 23zM18 7V5h-7V2H9v3H2v2h10.74a14.7 14.7 0 0 1-3.19 6.18A13.5 13.5 0 0 1 7.26 9h-2.1a16.5 16.5 0 0 0 3 5.58A16.8 16.8 0 0 1 3 18l.75 1.86A18.5 18.5 0 0 0 9.53 16a16.9 16.9 0 0 0 5.76 3.84L16 18a14.5 14.5 0 0 1-5.12-3.37A17.64 17.64 0 0 0 14.8 7z"
              />
            </svg>
          </span>
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 32 32"
            className="dropdown-arrow"
            style={{ transition: 'transform 0.2s ease' }}
          >
            <path fill="currentColor" d="M16 22 6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z" />
          </svg>
        </div>
        <div
          className="rspress-nav-menu-group-content rp-absolute rp-mx-0.8 rp-transition-opacity rp-duration-300"
          style={{
            opacity: 0,
            visibility: 'hidden',
            right: '0px',
            top: '32px',
            pointerEvents: 'none'
          }}
          role="menu"
        >
          <div
            className="rp-p-3 rp-pr-2 rp-w-full rp-h-full rp-max-h-100vh rp-whitespace-nowrap"
            style={{
              boxShadow: 'var(--rp-shadow-3)',
              zIndex: 100,
              border: '1px solid var(--rp-c-divider-light)',
              borderRadius: 'var(--rp-radius-large)',
              background: 'var(--rp-c-bg)',
            }}
          >
            {LANGUAGES.map((language) => {
              const href = getLanguageHref(language.code);
              
              if (language.code === currentLanguage.code) {
                return (
                  <div key={language.code}>
                    <div
                      className="rp-rounded-2xl rp-my-1 rp-flex"
                      style={{ padding: '0.4rem 1.5rem 0.4rem 0.75rem' }}
                    >
                      <a href={href} className="rp-text-brand">{currentLanguage.label}</a>
                    </div>
                  </div>
                );
              }
              return (
                <div key={language.code}>
                  <div className="rp-font-medium rp-my-1">
                    <a
                      href={href}
                      className="rp-link"
                      role="menuitem"
                    >
                      <div
                        className="rp-rounded-2xl hover:rp-bg-mute"
                        style={{ padding: '0.4rem 1.5rem 0.4rem 0.75rem' }}
                      >
                        <div className="rp-flex">
                          <span>{language.label}</span>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SwitchAppearance(props: ComponentProps<typeof BaseSwitchAppearance>) {
  return (
    <div className="rp-flex rp-items-center rp-justify-center rp-h-14">
      <LanguageDropdown />
      <BaseSwitchAppearance {...props} />
    </div>
  );
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
  // const lang = useLang();
  return (
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
  );
};

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

          if (index === 1) {
            const page = pages.find((currentPage) => currentPage.lang === lang && currentPage.frontmatter?.pageName === 'guide');
            if (page) {
              const allItems = getFeatureGroups(page).flatMap((group) => group.items ?? []);
              items = [...allItems.filter((item) => item.showOnHome), ...items];
            }
          } else if (index === 2) {
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

export * from '@rspress/core/theme-original';

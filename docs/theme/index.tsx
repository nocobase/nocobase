import { NoSSR, useLang } from '@rspress/core/runtime';
import { getCustomMDXComponent as basicGetCustomMDXComponent, Layout as BasicLayout, HomeFooter, HomeHero, renderHtmlOrText } from '@rspress/core/theme';
import {
  LlmsContainer,
  LlmsCopyButton,
  LlmsViewOptions,
} from '@rspress/plugin-llms/runtime';
import { useFrontmatter, useNavigate, usePageData } from '@rspress/runtime';
import type { Feature } from '@rspress/shared';
import type { JSX } from 'react';

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
      </>
    );
  };
  return {
    ...mdxComponents,
    h1: MyH1,
  };
}

export { getCustomMDXComponent };

  import './index.scss';

export interface HomeLayoutProps {
  beforeHero?: React.ReactNode;
  afterHero?: React.ReactNode;
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
  beforeFeatures?: React.ReactNode;
  afterFeatures?: React.ReactNode;
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
  } = usePageData();

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
              navigate(link);
            }
          }}
        >
          <div className="rp-home-feature__title-wrapper">
            <h2 className="rp-home-feature__title">{title}</h2>
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
  const { frontmatter } = useFrontmatter();
  const features = frontmatter?.features;

  return (
    <div>
      {features?.map((feature: any, index: number) => {
        return (
          <div key={feature.title || `feature-${index}`}>
            <div className="rp-home-feature-container">
              <h2 className="rp-home-feature-header">{feature.title}</h2>
              <p className="rp-home-feature-desc">{feature.details}</p>
            </div>
            <div className="rp-home-feature">
              {feature?.items?.map((item: any) => {
                return <HomeFeatureItem key={item.title} feature={item} />;
              })}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export * from '@rspress/core/theme';


import React, { useContext, useState, useEffect } from 'react';
import type { IRouteComponentProps } from '@umijs/types';
import { context, Link } from 'dumi/theme';
import Navbar from './components/Navbar';
import SideMenu from './components/SideMenu';
import SlugList from './components/SlugList';
import SearchBar from './components/SearchBar';
import './style/layout.less';

const Hero = hero => (
  <>
    <div className="__dumi-default-layout-hero">
      {hero.image && <img src={hero.image} />}
      <h1>{hero.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: hero.desc }} />
      {hero.actions &&
        hero.actions.map(action => (
          <Link to={action.link} key={action.text}>
            <button type="button">{action.text}</button>
          </Link>
        ))}
    </div>
  </>
);

const Features = features => (
  <div className="__dumi-default-layout-features">
    {features.map(feat => (
      <dl key={feat.title} style={{ backgroundImage: feat.icon ? `url(${feat.icon})` : undefined }}>
        {feat.link ? (
          <Link to={feat.link}>
            <dt>{feat.title}</dt>
          </Link>
        ) : (
          <dt>{feat.title}</dt>
        )}
        <dd dangerouslySetInnerHTML={{ __html: feat.desc }} />
      </dl>
    ))}
  </div>
);

const Layout: React.FC<IRouteComponentProps> = ({ children, location }) => {
  const {
    config: { mode, repository },
    meta,
    locale,
  } = useContext(context);
  const { url: repoUrl, branch, platform } = repository;
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(true);
  const isSiteMode = mode === 'site';
  const showHero = isSiteMode && meta.hero;
  const showFeatures = isSiteMode && meta.features;
  const showSideMenu = meta.sidemenu !== false && !showHero && !showFeatures && !meta.gapless;
  const showSlugs =
    !showHero &&
    !showFeatures &&
    Boolean(meta.slugs?.length) &&
    (meta.toc === 'content' || meta.toc === undefined) &&
    !meta.gapless;
  const isCN = /^zh|cn$/i.test(locale);
  const updatedTimeIns = new Date(meta.updatedTime);
  const updatedTime: any = `${updatedTimeIns.toLocaleDateString([], { hour12: false })} ${updatedTimeIns.toLocaleTimeString([], { hour12: false })}`;
  const repoPlatform =
    { github: 'GitHub', gitlab: 'GitLab' }[
      (repoUrl || '').match(/(github|gitlab)/)?.[1] || 'nothing'
    ] || platform;

  return (
    <div
      className="__dumi-default-layout"
      data-route={location.pathname}
      data-show-sidemenu={String(showSideMenu)}
      data-show-slugs={String(showSlugs)}
      data-site-mode={isSiteMode}
      data-gapless={String(!!meta.gapless)}
      onClick={() => {
        if (menuCollapsed) return;
        setMenuCollapsed(true);
      }}
    >
      <Navbar
        location={location}
        navPrefix={<SearchBar />}
        onMobileMenuClick={ev => {
          setMenuCollapsed(val => !val);
          ev.stopPropagation();
        }}
      />
      <SideMenu mobileMenuCollapsed={menuCollapsed} location={location} />
      {showSlugs && <SlugList slugs={meta.slugs} className="__dumi-default-layout-toc" />}
      {showHero && Hero(meta.hero)}
      {showFeatures && Features(meta.features)}
      <div className="__dumi-default-layout-content">
        {children}
        {!showHero && !showFeatures && meta.filePath && !meta.gapless && (
          <div className="__dumi-default-layout-footer-meta">
            {repoPlatform && (
              <Link to={`${repoUrl}/edit/${branch}/${meta.filePath}`}>
                {isCN ? `在 ${repoPlatform} 上编辑此页` : `Edit this doc on ${repoPlatform}`}
              </Link>
            )}
            <span data-updated-text={isCN ? '最后更新时间：' : 'Last update: '}>{updatedTime}</span>
          </div>
        )}
        {(showHero || showFeatures) && meta.footer && (
          <div
            className="__dumi-default-layout-footer"
            dangerouslySetInnerHTML={{ __html: meta.footer }}
          />
        )}
      </div>
    </div>
  );
};

export default Layout;

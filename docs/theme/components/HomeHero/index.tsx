import type { FrontMatterMeta } from '@rspress/core';
import { normalizeImagePath, useFrontmatter } from '@rspress/core/runtime';
import { Button, Link, renderHtmlOrText } from '@rspress/core/theme';

import './index.scss';
import clsx from 'clsx';

const DEFAULT_HERO = {
  badge: '',
  name: '',
  text: '',
  tagline: '',
  actions: [],
  image: undefined,
} satisfies FrontMatterMeta['hero'];

interface HomeHeroProps {
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
  image?: React.ReactNode;
}

function HomeHero({
  beforeHeroActions,
  afterHeroActions,
  image,
}: HomeHeroProps) {
  const { frontmatter } = useFrontmatter();
  const hero = frontmatter?.hero || DEFAULT_HERO;
  const hasImage = hero.image !== undefined || image !== undefined;
  const multiHeroText = hero.text
    ? hero.text
        .toString()
        .split(/\n/g)
        .filter(text => text !== '')
    : [];
  const imageSrc =
    typeof hero.image?.src === 'string'
      ? { light: hero.image.src, dark: hero.image.src }
      : hero.image?.src || { light: '', dark: '' };

  return (
    <div
      className={clsx('rp-home-hero', { 'rp-home-hero--no-image': !hasImage })}
    >
      <div className="rp-home-hero__container">
        {hero.badge &&
          (typeof hero.badge === 'string' ? (
            <div className="rp-home-hero__badge">{hero.badge}</div>
          ) : hero.badge.link ? (
            <Link href={hero.badge.link} className="rp-home-hero__badge">
              {hero.badge.text}
            </Link>
          ) : (
            <div className="rp-home-hero__badge">{hero.badge.text}</div>
          ))}
        <div className="rp-home-hero__content">
          <div className="rp-home-hero__title">
            <span
              className="rp-home-hero__title-brand"
              {...renderHtmlOrText(hero.name)}
            ></span>
          </div>

          {multiHeroText.length !== 0 &&
            multiHeroText.map(heroText => (
              <div
                key={heroText}
                className="rp-home-hero__subtitle"
                {...renderHtmlOrText(heroText)}
              ></div>
            ))}
        </div>
        <p
          className="rp-home-hero__tagline"
          {...renderHtmlOrText(hero.tagline)}
        ></p>

        <>
          {beforeHeroActions}
          <div className="rp-home-hero__actions">
            {hero.actions?.map(action => {
              return (
                <Button
                  type="a"
                  key={action.link}
                  href={action.link}
                  theme={action.theme}
                  className="rp-home-hero__action"
                  {...renderHtmlOrText(action.text)}
                />
              );
            })}
          </div>
          {afterHeroActions}
        </>
      </div>
      {image ? (
        <div className="rp-home-hero__image">{image}</div>
      ) : hero.image ? (
        <div className="rp-home-hero__image">
          <img
            src={normalizeImagePath(imageSrc.light)}
            alt={hero.image?.alt}
            srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
            sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
            width={375}
            height={375}
            className="rp-home-hero__image-img rp-home-hero__image-img--light"
          />
          <img
            src={normalizeImagePath(imageSrc.dark)}
            alt={hero.image?.alt}
            srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
            sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
            width={375}
            height={375}
            className="rp-home-hero__image-img rp-home-hero__image-img--dark"
          />
        </div>
      ) : null}
    </div>
  );
}

function normalizeSrcsetAndSizes(
  field: undefined | string | string[],
): string | undefined {
  const r = (Array.isArray(field) ? field : [field]).filter(Boolean).join(', ');
  return r || undefined;
}

export type { HomeHeroProps };
export { HomeHero };

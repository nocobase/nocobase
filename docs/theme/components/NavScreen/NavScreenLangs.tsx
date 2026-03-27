import { useState } from 'react';
import { useLangsMenu } from '../Nav/hooks';
import './NavScreenLangs.scss';
import { useI18n } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme';
import clsx from 'clsx';
import { SvgDown } from './NavScreenMenuItem';

export function NavScreenLangs() {
  const { items, activeValue } = useLangsMenu();
  const [isOpen, setIsOpen] = useState(false);
  const t = useI18n();

  return items.length > 1 ? (
    <>
      <div className="rp-nav-screen-langs" onClick={() => setIsOpen(!isOpen)}>
        <div className="rp-nav-screen-langs__left">{t('languagesText')}</div>
        <div className="rp-nav-screen-langs__right">
          {activeValue}
          <SvgDown
            className={`rp-nav-screen-langs__icon ${isOpen ? 'rp-nav-screen-langs__icon--open' : ''}`}
          />
        </div>
      </div>
      <div
        className="rp-nav-screen-langs-group"
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease-out',
        }}
      >
        <div className="rp-nav-screen-langs-group__inner">
          {items.map(item => {
            const isActive = item.text === activeValue;
            const className = clsx(
              'rp-nav-screen-langs-group__item',
              isActive && 'rp-nav-screen-langs-group__item--active',
            );

            return isActive ? (
              <span
                key={item.text}
                className={className}
                aria-current="page"
                aria-disabled={true}
              >
                {item.text}
              </span>
            ) : (
              <Link
                key={item.text}
                href={item.link}
                className={className}
                hrefLang={item.lang}
                lang={item.lang}
                rel="alternate"
              >
                {item.text}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  ) : null;
}

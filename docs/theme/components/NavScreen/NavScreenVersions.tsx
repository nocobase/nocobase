import { useState } from 'react';
import { useVersionsMenu } from '../Nav/hooks';
import './NavScreenVersions.scss';
import { useI18n } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme';
import clsx from 'clsx';
import { SvgDown } from './NavScreenMenuItem';

export function NavScreenVersions() {
  const { items, activeValue } = useVersionsMenu();
  const [isOpen, setIsOpen] = useState(false);
  const t = useI18n();

  return items.length > 1 ? (
    <>
      <div
        className="rp-nav-screen-versions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="rp-nav-screen-versions__left">{t('versionsText')}</div>
        <div className="rp-nav-screen-versions__right">
          {activeValue}
          <SvgDown
            className={clsx('rp-nav-screen-versions__icon', {
              'rp-nav-screen-versions__icon--open': isOpen,
            })}
          />
        </div>
      </div>
      <div
        className={clsx(
          'rp-nav-screen-versions-group',
          isOpen && 'rp-nav-screen-versions-group--open',
        )}
      >
        {items.map(item => {
          const isActive = item.text === activeValue;
          const className = clsx(
            'rp-nav-screen-versions-group__item',
            isActive && 'rp-nav-screen-versions-group__item--active',
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
            <Link key={item.text} href={item.link} className={className}>
              {item.text}
            </Link>
          );
        })}
      </div>
    </>
  ) : null;
}

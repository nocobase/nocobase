import { Badge } from '@rspress/core/theme';
import { useLang, useNavigate } from '@rspress/runtime';
import React from 'react';
import { EditionLevels, EditionLevelsEN, EditionLevelsTypes } from './EditionLevels';

export interface PluginCardProps {
  name: string;
  developer?: string;
  description: string;
  detailLink?: string;
  isFree?: boolean;
  supportedVersions?: string[];
  version?: string;
  editionLevel?: number;
  pricing?: {
    plan1?: {
      label: string;
      points: number;
      price: number;
    };
    plan2?: {
      label: string;
      points: number;
      price: number;
    };
  };
  float?: boolean;
}

export function PluginPrice() {

  const cardStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  return (

    <div style={cardStyle}>
      <div style={{ flexGrow: 1 }}>
        <div className="rp-plugin-price" style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
          <Badge type="warning">
            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
              <span style={{ fontSize: '12px', }}>
                永久使用, 1 年升级
              </span>
              <br />
              <a target="_blank" href="https://www.nocobase.com/cn/plugins-bundles" style={{ textDecoration: 'none' }}>
                2 <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
              </a>
              <span>/</span>
              <span>￥600</span>
            </h6>
          </Badge>
          <Badge type="warning">
            <h6 style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>
              <span style={{ fontSize: '12px', }}>
                永久使用和升级
              </span>
              <br />
              <a target="_blank" href="https://www.nocobase.com/cn/plugins-bundles" style={{ textDecoration: 'none' }}>
                4 <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
              </a>
              <span >/</span>
              <span >￥1,200</span>
            </h6>
          </Badge>
        </div>
      </div>
    </div>

  );
}

export const PluginCard: React.FC<PluginCardProps> = ({
  name,
  developer = 'NocoBase',
  description,
  detailLink,
  isFree = false,
  editionLevel,
  version,
  supportedVersions = [],
  pricing,
  float = false,
}) => {
  const navigate = useNavigate();
  const cardStyle: React.CSSProperties = {
    border: '1px solid transparent',
    borderRadius: '12px',
    padding: '2rem',
    background: 'var(--rp-home-feature-bg)',
    boxShadow: 'none',
    transition: 'all 0.3s',
    display: 'inline-block',
    verticalAlign: 'top',
    width: float ? 'auto' : '100%',
    maxWidth: float ? '400px' : 'none',
    boxSizing: 'border-box',
  };
  const lang = useLang();

  return (
    <>
      <div onClick={() => {
        if (detailLink) {
          navigate(detailLink);
        }
      }} className="rp-plugin-card rp-home-feature__card rp-home-feature__card--clickable" style={cardStyle} data-plugin-card={float ? 'float' : 'full'}>
        <div style={{ marginTop: '0.5rem', flexGrow: 1 }}>
          <h6 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: 600, color: 'var(--rp-c-text-1)' }}>
            {name}
            {/* {' '}
            {supportedVersions.length === 1 && supportedVersions[0] === '2.x' && (
              <Badge type="info">
                {supportedVersions[0]}
              </Badge>
            )} */}
          </h6>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--rp-c-text-2)',
              marginBottom: '0.75rem',
              paddingBottom: '0.75rem',
              // borderBottom: '1px solid #f0f0f0'
            }}>
            By <span>{developer}</span>
          </div>
          <p style={{ minHeight: '4em', margin: '0 0 0.5rem 0', fontSize: '14px', color: 'var(--rp-c-text-2)', lineHeight: 1.4 }}>
            {description}
          </p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {/* {isFree && (
            <Badge type="tip">Free</Badge>
          )} */}
          {editionLevel >= 0 && (
            <Badge type={EditionLevelsTypes[editionLevel as number]}>
              {lang === 'cn' ? EditionLevels[editionLevel as number] : EditionLevelsEN[editionLevel as number]}+
            </Badge>
          )}
          {version && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: '#f6ffed',
                color: '#52c41a',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {version}
            </span>
          )}
        </div>
        {pricing && (pricing.plan1 || pricing.plan2) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            {pricing.plan1 && (
              <h6 style={{ margin: 0, color: '#2f55d4', fontSize: '14px' }}>
                <span style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', color: 'var(--rp-c-text-2)' }}>
                  {pricing.plan1.label}
                </span>
                <br />
                <a href="/cn/plugins-bundles" style={{ color: '#2f55d4', textDecoration: 'none' }}>
                  {pricing.plan1.points} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
                </a>
                <span style={{ color: 'var(--rp-c-text-2)' }}>/</span>
                <span style={{ color: 'var(--rp-c-text-2)' }}>{lang === 'cn' ? '￥' : '$'}{pricing.plan1.price.toLocaleString('en-US')}</span>
              </h6>
            )}
            {pricing.plan2 && (
              <h6 style={{ margin: '0 0 0 8px', fontWeight: 'normal', color: 'var(--rp-c-text-2)', fontSize: '14px' }}>
                <span style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', color: 'var(--rp-c-text-2)' }}>
                  {pricing.plan2.label}
                </span>
                <br />
                <a href="/cn/plugins-bundles" style={{ color: 'var(--rp-c-text-2)', textDecoration: 'none' }}>
                  {pricing.plan2.points} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
                </a>
                <span style={{ color: 'var(--rp-c-text-2)' }}>/</span>
                <span style={{ color: 'var(--rp-c-text-2)' }}>{lang === 'cn' ? '￥' : '$'}{pricing.plan2.price.toLocaleString('en-US')}</span>
              </h6>
            )}
          </div>
        )}
      </div>
    </>
  );
};

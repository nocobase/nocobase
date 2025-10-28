import React from 'react';

export interface PluginCardProps {
  name: string;
  developer?: string;
  description: string;
  detailLink?: string;
  isFree?: boolean;
  version?: string;
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

export const PluginCard: React.FC<PluginCardProps> = ({
  name,
  developer = 'NocoBase',
  description,
  detailLink,
  isFree = true,
  version,
  pricing,
  float = false,
}) => {
  const cardStyle: React.CSSProperties = {
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '2rem',
    background: '#fff',
    boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.1)',
    transition: 'all 0.3s',
    display: 'inline-block',
    verticalAlign: 'top',
    width: float ? 'auto' : '100%',
    maxWidth: float ? '400px' : 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div style={cardStyle} data-plugin-card={float ? 'float' : 'full'}>
        <div style={{ marginTop: '0.5rem', flexGrow: 1 }}>
          <h6 style={{ margin: '0 0 0.25rem 0', fontSize: '16px', fontWeight: 600, color: '#262626' }}>
            {name}
          </h6>
          <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f0f0f0' }}>
            By <span>{developer}</span>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#8c8c8c', lineHeight: 1.4 }}>
            {description}
            {detailLink && (
              <>
                {' '}
                <a href={detailLink} style={{ color: '#1890ff', fontSize: '14px', textDecoration: 'none' }}>
                  详情
                </a>
              </>
            )}
          </p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {isFree && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(47, 85, 212, 0.1)',
                color: '#2f55d4',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                marginRight: '8px',
              }}
            >
              免费
            </span>
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
                <span style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', color: '#8c8c8c' }}>
                  {pricing.plan1.label}
                </span>
                <br />
                <a href="/cn/plugins-bundles" style={{ color: '#2f55d4', textDecoration: 'none' }}>
                  {pricing.plan1.points} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
                </a>
                <span style={{ color: '#8c8c8c' }}>/</span>
                <span style={{ color: '#8c8c8c' }}>￥{pricing.plan1.price.toLocaleString('en-US')}</span>
              </h6>
            )}
            {pricing.plan2 && (
              <h6 style={{ margin: '0 0 0 auto', fontWeight: 'normal', color: '#8c8c8c', fontSize: '14px' }}>
                <span style={{ fontWeight: 'normal', fontStyle: 'italic', fontSize: '12px', color: '#8c8c8c' }}>
                  {pricing.plan2.label}
                </span>
                <br />
                <a href="/cn/plugins-bundles" style={{ color: '#8c8c8c', textDecoration: 'none' }}>
                  {pricing.plan2.points} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
                </a>
                <span style={{ color: '#8c8c8c' }}>/</span>
                <span style={{ color: '#8c8c8c' }}>￥{pricing.plan2.price.toLocaleString('en-US')}</span>
              </h6>
            )}
          </div>
        )}
      </div>
    </>
  );
};

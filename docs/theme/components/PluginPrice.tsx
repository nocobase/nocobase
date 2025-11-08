import { Badge } from '@rspress/core/theme';
import { useLang } from '@rspress/runtime';
import React from 'react';

export function PluginPrice({ points }: { points: number }) {

  const cardStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  const lang = useLang();

  const price = (lang === 'cn' ? 300 : 50);
  const priceString1 = (lang === 'cn' ? '￥' : '$') + (points * price * 1).toLocaleString('en-US');
  const priceString2 = (lang === 'cn' ? '￥' : '$') + (points * price * 2).toLocaleString('en-US');

  return (

    <div style={cardStyle}>
      <div style={{ flexGrow: 1 }}>
        <span className="rp-plugin-price" style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
          <code>
            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
              <span style={{ fontSize: '12px', }}>
                {lang === 'cn' ? '永久使用, 1 年升级' : 'Lifetime use, 1-year upgrade'}
              </span>
              <br />
              <a target="_blank" href="https://www.nocobase.com/cn/plugins-bundles" style={{ textDecoration: 'none' }}>
                {points * 1} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
              </a>
              <span>/</span>
              <span>{priceString1}</span>
            </h6>
          </code>
          <code>
            <h6 style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>
              <span style={{ fontSize: '12px', }}>
                {lang === 'cn' ? '永久使用和升级' : 'Lifetime use & upgrade'}
              </span>
              <br />
              <a target="_blank" href="https://www.nocobase.com/cn/plugins-bundles" style={{ textDecoration: 'none' }}>
                {points * 2} <i className="uil uil-moon-eclipse" style={{ marginRight: '4px' }}></i>
              </a>
              <span >/</span>
              <span >{priceString2}</span>
            </h6>
          </code>
        </span>
      </div>
    </div>

  );
}
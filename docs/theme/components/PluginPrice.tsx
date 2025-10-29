import { Badge } from '@rspress/core/theme';
import React from 'react';

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
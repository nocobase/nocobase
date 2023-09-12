import type { ThemeConfig } from 'antd/es/config-provider/context';
import type { FC } from 'react';
import React from 'react';
import getColorBgImg from '../utils/getColorBgImg';
import getDesignToken from '../utils/getDesignToken';

export type TokenPreviewProps = {
  theme: ThemeConfig;
  tokenName: string;
  type?: string;
};

const TokenPreview: FC<TokenPreviewProps> = ({ theme, tokenName, type }) => {
  if (type === 'Color') {
    return (
      <div
        style={{
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: (getDesignToken(theme) as any)[tokenName],
            transition: 'background-color 0.2s',
          }}
        />
      </div>
    );
  }
  if (type === 'FontSize') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
          fontSize: (getDesignToken(theme) as any)[tokenName],
          fontWeight: 700,
        }}
      >
        <span>Aa</span>
      </div>
    );
  }
  if (type === 'LineHeight') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          overflow: 'hidden',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
        }}
      >
        <span
          style={{
            fontSize: (getDesignToken(theme) as any)[tokenName.replace('lineHeight', 'fontSize')],
            lineHeight: (getDesignToken(theme) as any)[tokenName],
            background: '#fff2f0',
            paddingInline: 8,
          }}
        >
          Aa
        </span>
      </div>
    );
  }
  if (type === 'Margin') {
    const margin = (getDesignToken(theme) as any)[tokenName];
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: '#fff1b8',
            transform: 'translate(10%, 10%) scale(0.8)',
          }}
        >
          <div
            style={{
              marginLeft: margin,
              marginTop: margin,
              width: `calc(100% - ${margin}px)`,
              height: `calc(100% - ${margin}px)`,
              background: '#bae0ff',
            }}
          />
        </div>
      </div>
    );
  }
  if (type === 'Padding') {
    const padding = (getDesignToken(theme) as any)[tokenName];
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: '#d9f7be',
            transform: 'translate(10%, 10%) scale(0.8)',
            paddingLeft: padding,
            paddingTop: padding,
          }}
        >
          <div
            style={{
              width: `100%`,
              height: `100%`,
              background: '#bae0ff',
            }}
          />
        </div>
      </div>
    );
  }
  if (type === 'BorderRadius') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            transform: 'translate(30%, 30%)',
            border: '2px solid rgba(0,0,0,0.45)',
            background: '#fff',
            borderRadius: (getDesignToken(theme) as any)[tokenName],
          }}
        />
      </div>
    );
  }
  if (type === 'BoxShadow') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${getColorBgImg(false)} 0% 0% / 28px`,
        }}
      >
        <div
          style={{
            width: '60%',
            height: '50%',
            borderRadius: 6,
            background: '#fff',
            border: '1px solid #d9d9d9',
            boxShadow: (getDesignToken(theme) as any)[tokenName],
          }}
        />
      </div>
    );
  }
  return null;
};

export default TokenPreview;

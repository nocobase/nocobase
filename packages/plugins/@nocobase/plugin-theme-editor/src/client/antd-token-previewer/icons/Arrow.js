import * as React from 'react';

function Arrow(props) {
  return /*#__PURE__*/ React.createElement(
    'svg',
    Object.assign(
      {
        width: '1em',
        height: '1em',
        viewBox: '0 0 16 16',
        xmlns: 'http://www.w3.org/2000/svg',
        xmlnsXlink: 'http://www.w3.org/1999/xlink',
      },
      props,
      {
        style: Object.assign(
          {
            verticalAlign: '-0.125em',
          },
          props.style,
        ),
        className: ['nanqu-token-panel-icon', props.className].filter(Boolean).join(' '),
      },
    ),
    /*#__PURE__*/ React.createElement(
      'g',
      {
        id: 'Arrow-\u9875\u9762-1',
        stroke: 'none',
        strokeWidth: 1,
        fill: 'none',
        fillRule: 'evenodd',
      },
      /*#__PURE__*/ React.createElement(
        'g',
        {
          id: 'Arrow-\u4E3B\u9898\u9884\u89C8\u5668---\u7EC4\u4EF6\u9884\u89C8',
          transform: 'translate(-335.000000, -153.000000)',
          fill: 'currentColor',
          fillRule: 'nonzero',
        },
        /*#__PURE__*/ React.createElement(
          'g',
          {
            id: 'Arrow-\u7F16\u7EC4-18',
            transform: 'translate(0.000000, 70.000000)',
          },
          /*#__PURE__*/ React.createElement(
            'g',
            {
              id: 'Arrow-\u7F16\u7EC4-13',
              transform: 'translate(331.000000, 79.000000)',
            },
            /*#__PURE__*/ React.createElement(
              'g',
              {
                id: 'Arrow-\u6298\u53E0\u7BAD\u5934_Black@2x',
                transform:
                  'translate(12.000000, 12.000000) rotate(90.000000) translate(-12.000000, -12.000000) translate(4.000000, 4.000000)',
              },
              /*#__PURE__*/ React.createElement('rect', {
                id: 'Arrow-\u77E9\u5F62',
                opacity: 0,
                x: 0,
                y: 0,
                width: 16,
                height: 16,
              }),
              /*#__PURE__*/ React.createElement('path', {
                d:
                  'M8.576,10.6224 C8.46400007,10.7357654 8.31136002,10.7997014 8.152,10.8 L7.848,10.8 C7.68897547,10.7980619 7.53693306,10.7343763 7.424,10.6224 L3.3184,6.4672 C3.16044703,6.30862179 3.16044703,6.05217821 3.3184,5.8936 L3.8864,5.3192 C3.95991079,5.24354153 4.06091047,5.20085176 4.1664,5.20085176 C4.27188953,5.20085176 4.37288921,5.24354153 4.4464,5.3192 L8,8.9168 L11.5536,5.3192 C11.6284927,5.24307539 11.7308111,5.20020394 11.8376,5.20020394 C11.9443889,5.20020394 12.0467073,5.24307539 12.1216,5.3192 L12.6816,5.8936 C12.839553,6.05217821 12.839553,6.30862179 12.6816,6.4672 L8.576,10.6224 Z',
                id: 'Arrow-\u8DEF\u5F84',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}

export default Arrow;

import * as React from 'react';

function TokenPanel(props) {
  return /*#__PURE__*/ React.createElement(
    'svg',
    Object.assign(
      {
        width: '1em',
        height: '1em',
        viewBox: '0 0 20 19',
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
        id: 'TokenPanel-\u9875\u9762-1',
        stroke: 'none',
        strokeWidth: 1,
        fill: 'none',
        fillRule: 'evenodd',
        fillOpacity: 0.85,
      },
      /*#__PURE__*/ React.createElement(
        'g',
        {
          id: 'TokenPanel-\u4E3B\u9898\u7F16\u8F91\u5668---\u591A\u4E3B\u9898',
          transform: 'translate(-14.000000, -70.000000)',
          fill: 'currentColor',
        },
        /*#__PURE__*/ React.createElement(
          'g',
          {
            id: 'TokenPanel-\u7F16\u7EC4-3',
            transform: 'translate(10.000000, 66.000000)',
          },
          /*#__PURE__*/ React.createElement(
            'g',
            {
              id: 'TokenPanel-\u7F16\u7EC4-20',
              transform: 'translate(4.000000, 4.000000)',
            },
            /*#__PURE__*/ React.createElement('rect', {
              id: 'TokenPanel-\u77E9\u5F62',
              opacity: 0.600000024,
              x: 1,
              y: 12,
              width: 7,
              height: 7,
              rx: 0.434782594,
            }),
            /*#__PURE__*/ React.createElement('path', {
              d: 'M12.3540059,0 L19.5652174,0 C19.8053412,8.08981097e-16 20,0.194658804 20,0.434782609 L20,7.6459941 C20,7.88611791 19.8053412,8.08077671 19.5652174,8.08077671 C19.4499059,8.08077671 19.3393172,8.03496939 19.2577797,7.95343183 L12.0465682,0.74222034 C11.876775,0.572427169 11.876775,0.297138048 12.0465682,0.127344878 C12.1281057,0.0458073219 12.2386944,-6.44951433e-16 12.3540059,0 Z',
              id: 'TokenPanel-\u77E9\u5F62',
              opacity: 0.400000006,
            }),
            /*#__PURE__*/ React.createElement('circle', {
              id: 'TokenPanel-\u692D\u5706\u5F62',
              cx: 4.34782609,
              cy: 4.34782609,
              r: 4.34782609,
            }),
            /*#__PURE__*/ React.createElement('circle', {
              id: 'TokenPanel-\u692D\u5706\u5F62',
              cx: 15.5,
              cy: 15.5,
              r: 3.5,
            }),
          ),
        ),
      ),
    ),
  );
}

export default TokenPanel;

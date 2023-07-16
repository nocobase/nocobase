import { genStyleHook } from '../../../__builtins__';

const useStyles = genStyleHook('nb-gantt-task-item', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.barLabel': {
        fill: token.colorTextLightSolid,
        textAnchor: 'middle',
        fontWeight: 400,
        dominantBaseline: 'central',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
      },

      '.projectLabel': {
        fill: '#130d0d',
        fontWeight: 500,
        fontSize: '0.9em',
        dominantBaseline: 'central',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
      },

      '.barLabelOutside': {
        fill: token.colorTextLabel,
        textAnchor: 'start',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
      },
    },
  };
});

export default useStyles;

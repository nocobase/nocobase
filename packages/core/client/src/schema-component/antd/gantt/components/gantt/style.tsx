import { genStyleHook } from '../../../__builtins__';

const useStyles = genStyleHook('nb-gantt', (token) => {
  const { componentCls } = token;

  return {
    [componentCls]: {
      '.ganttVerticalContainer': {
        overflow: 'hidden',
        fontSize: '0',
        margin: '0',
        padding: '0',
        width: '100%',
        borderLeft: `2px solid ${token.colorBorderSecondary}`,

        '.ganttHeader': { borderBottom: `1px solid ${token.colorBorderSecondary}`, fontWeight: 700 },
        '.ganttBody': { borderBottom: `1px solid ${token.colorBorderSecondary}` },
      },

      '.horizontalContainer': {
        margin: '0',
        padding: '0',
        overflow: 'hidden',
      },

      '.wrapper': {
        display: 'flex',
        padding: '0',
        margin: '0',
        listStyle: 'none',
        outline: 'none',
        position: 'relative',
        '.gantt-horizontal-scoll': { display: 'none' },
        '&:hover': { '.gantt-horizontal-scoll': { display: 'block' } },
      },
    },
  };
});

export default useStyles;

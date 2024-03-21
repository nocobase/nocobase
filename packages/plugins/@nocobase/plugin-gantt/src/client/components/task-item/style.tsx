import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    nbganttTaskitem: css`
      .barLabel: {
        fill: ${token.colorTextLightSolid},
        textAnchor: middle,
        font-weight: 400,
        dominantBaseline: central,
        WebkitTouchCallout: none,
        WebkitUserSelect: none,
        MozUserSelect: none,
        msUserSelect: none,
        userSelect: none,
        pointerEvents: none,
      },
      .projectLabel: {
        fill: #130d0d,
        fontWeight: 500,
        fontSize: 0.9em,
        dominantBaseline: central,
        WebkitTouchCallout: none,
        WebkitUserSelect: none,
        MozUserSelect: none,
        msUserSelect: none,
        userSelect: none,
        pointerEvents: none,
      },
      .barLabelOutside: {
        fill: ${token.colorTextLabel},
        textAnchor: start,
        WebkitTouchCallout: none,
        WebkitUserSelect: none,
        MozUserSelect: none,
        msUserSelect: none,
        userSelect: none,
        pointerEvents: none,
      },
    }
  }`,
  };
});

export default useStyles;

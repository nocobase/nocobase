/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

import React, { useRef, useEffect, useContext, createContext, useReducer, useState, useMemo } from 'react';
import { isNumber, debounce } from 'lodash-es';
import styles from './style.css';

const DEFAULT_VID = 'vTable';
const vidMap = new Map();

const initialState = {
  // 行高度
  rowHeight: 55,
  // 当前的scrollTop
  curScrollTop: 0,
  // 总行数
  totalLen: 0,
};

function reducer(state, action) {
  const { curScrollTop, rowHeight, totalLen, ifScrollTopClear } = action;

  let stateScrollTop = state.curScrollTop;
  switch (action.type) {
    // 改变trs 即 改变渲染的列表trs
    case 'changeTrs':
      return {
        ...state,
        curScrollTop,
      };
    // 初始化每行的高度, 表格总高度, 渲染的条数
    case 'initHeight':
      return {
        ...state,
        rowHeight,
      };
    // 更改totalLen
    case 'changeTotalLen':
      if (totalLen === 0) {
        stateScrollTop = 0;
      }

      return {
        ...state,
        totalLen,
        curScrollTop: stateScrollTop,
      };

    case 'reset':
      return {
        ...state,
        curScrollTop: ifScrollTopClear ? 0 : state.curScrollTop,
      };
    default:
      throw new Error();
  }
}

const ScrollContext = createContext({
  dispatch: undefined,
  renderLen: 1,
  start: 0,
  offsetStart: 0,
  rowHeight: initialState.rowHeight,
  totalLen: 0,
  vid: DEFAULT_VID,
});

function VCell(props: any): JSX.Element {
  const { children, ...restProps } = props;

  return (
    <td {...restProps}>
      <div>{children}</div>
    </td>
  );
}

function VRow(props: any, ref: any): JSX.Element {
  const { dispatch, rowHeight, totalLen, vid } = useContext(ScrollContext);
  const { children, style, ...restProps } = props;
  const trRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    const initHeight = (tempRef) => {
      if (tempRef?.current?.offsetHeight && !rowHeight && totalLen) {
        const tempRowHeight = tempRef?.current?.offsetHeight ?? 0;

        vidMap.set(vid, {
          ...vidMap.get(vid),
          rowItemHeight: tempRowHeight,
        });
        dispatch({
          type: 'initHeight',
          rowHeight: tempRowHeight,
        });
      }
    };
    initHeight(Object.prototype.hasOwnProperty.call(ref, 'current') ? ref : trRef);
  }, [trRef, dispatch, rowHeight, totalLen, ref, vid]);

  return (
    <tr
      {...restProps}
      ref={Object.prototype.hasOwnProperty.call(ref, 'current') ? ref : trRef}
      style={{
        ...style,
        height: rowHeight || 'auto',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </tr>
  );
}

function VWrapper(props: any): JSX.Element {
  const { children, ...restProps } = props;
  const { renderLen, start, dispatch, vid, totalLen } = useContext(ScrollContext);

  const contents = useMemo(() => {
    return children[1];
  }, [children]);

  const contentsLen = useMemo(() => {
    return contents?.length ?? 0;
  }, [contents]);

  useEffect(() => {
    if (totalLen !== contentsLen) {
      dispatch({
        type: 'changeTotalLen',
        totalLen: contentsLen ?? 0,
      });
    }
  }, [contentsLen, dispatch, vid, totalLen]);

  let tempNode = null;
  if (Array.isArray(contents) && contents.length) {
    tempNode = [children[0], contents.slice(start, start + (renderLen ?? 1))];
  } else {
    tempNode = children;
  }
  return <tbody {...restProps}>{tempNode}</tbody>;
}

function VTable(props: any, otherParams): JSX.Element {
  const { style, children, ...rest } = props;
  const { width, ...rest_style } = style;
  const { vid, scrollY, reachEnd, onScroll, resetScrollTopWhenDataChange } = otherParams ?? {};
  const [state, dispatch] = useReducer(reducer, initialState);
  const wrap_tableRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const ifChangeRef = useRef(false);
  // 数据的总条数
  const [totalLen, setTotalLen] = useState<number>(children[1]?.props?.data?.length ?? 0);
  useEffect(() => {
    setTotalLen(state.totalLen);
  }, [state.totalLen]);

  // 组件卸载的清除操作
  useEffect(() => {
    return () => {
      vidMap.delete(vid);
    };
  }, [vid]);

  // 数据变更
  useEffect(
    () => {
      ifChangeRef.current = true;
      if (isNumber(children[1]?.props?.data?.length)) {
        dispatch({
          type: 'changeTotalLen',
          totalLen: children[1]?.props?.data?.length ?? 0,
        });
      }
    },
    [children[1].props.data],
    scrollY,
  );

  // table总高度
  const tableHeight = useMemo<string | number>(() => {
    let temp: string | number = 'auto';

    if (state.rowHeight && totalLen) {
      temp = state.rowHeight * totalLen;
    }
    return temp;
  }, [state.rowHeight, totalLen]);

  // table的scrollY值
  const [tableScrollY, setTableScrollY] = useState(0);

  // tableScrollY 随scrollY / tableHeight 进行变更
  useEffect(() => {
    let temp = 0;

    if (typeof scrollY === 'string') {
      temp = (wrap_tableRef.current?.parentNode as HTMLElement)?.offsetHeight ?? 0;
    } else {
      temp = scrollY;
    }

    // 处理tableScrollY <= 0的情况
    if (temp <= 0) {
      temp = 0;
    }

    setTableScrollY(temp);
  }, [scrollY, tableHeight]);

  // 渲染的条数
  const renderLen = useMemo<number>(() => {
    let temp = Math.floor(tableScrollY / state.rowHeight);
    if (state.rowHeight && totalLen && tableScrollY) {
      if (tableScrollY <= 0) {
        temp = 0;
      } else {
        const tempRenderLen = ((tableScrollY / state.rowHeight) | 0) + 2;
        temp = tempRenderLen;
      }
    }
    return temp;
  }, [state.rowHeight, totalLen, tableScrollY]);

  // 渲染中的第一条
  let start = state.rowHeight ? (state.curScrollTop / state.rowHeight) | 0 : 0;
  // 偏移量
  let offsetStart = state.rowHeight ? state.curScrollTop % state.rowHeight : 0;

  // 用来优化向上滚动出现的空白
  if (state.curScrollTop && state.rowHeight && state.curScrollTop > state.rowHeight) {
    start -= 1;
    offsetStart += state.rowHeight;
  } else {
    start = 0;
  }

  // 数据变更 操作scrollTop
  useEffect(() => {
    const scrollNode = wrap_tableRef.current?.parentNode as HTMLElement;
    if (ifChangeRef?.current) {
      ifChangeRef.current = false;
      if (resetScrollTopWhenDataChange) {
        // 重置scrollTop
        if (scrollNode) {
          scrollNode.scrollTop = state.curScrollTop;
        }
        dispatch({ type: 'reset', ifScrollTopClear: true });
      } else {
        // 不重置scrollTop 不清空curScrollTop
        dispatch({ type: 'reset', ifScrollTopClear: false });
      }
    }
    if (vidMap.has(vid)) {
      vidMap.set(vid, {
        ...vidMap.get(vid),
        scrollNode,
      });
    }
  }, [totalLen, resetScrollTopWhenDataChange, vid, children]);

  useEffect(() => {
    const throttleScroll = (e) => {
      const scrollTop: number = e?.target?.scrollTop ?? 0;
      const scrollHeight: number = e?.target?.scrollHeight ?? 0;
      const clientHeight: number = e?.target?.clientHeight ?? 0;
      // 到底了 没有滚动条就不会触发reachEnd.
      if (scrollTop === scrollHeight) {
        reachEnd && reachEnd();
      } else if (scrollTop + clientHeight >= scrollHeight) {
        // 有滚动条的情况
        reachEnd && reachEnd();
      }
      onScroll && onScroll();
      dispatch({
        type: 'changeTrs',
        curScrollTop: scrollTop,
      });
    };
    const ref = wrap_tableRef?.current?.parentNode as HTMLElement;
    if (ref) {
      ref.addEventListener('scroll', throttleScroll);
    }
    return () => {
      ref.removeEventListener('scroll', throttleScroll);
    };
  }, [onScroll, reachEnd]);

  return (
    <div
      className={styles['virtuallist']}
      ref={wrap_tableRef}
      style={{
        width: '100%',
        position: 'relative',
        height: tableHeight,
        boxSizing: 'border-box',
        paddingTop: state.curScrollTop,
      }}
    >
      <ScrollContext.Provider
        value={{
          dispatch,
          rowHeight: vidMap?.get(vid)?.rowItemHeight,
          start,
          offsetStart,
          renderLen,
          totalLen,
          vid,
        }}
      >
        <table
          {...rest}
          ref={tableRef}
          style={{
            ...rest_style,
            width,
            position: 'relative',
            transform: `translateY(-${offsetStart}px)`,
          }}
        >
          {children}
        </table>
      </ScrollContext.Provider>
    </div>
  );
}

export function VList(props: {
  height: number | string;
  onReachEnd?: () => void;
  onScroll?: () => void;
  onListRender?: (listInfo: { start: number; renderLen: number }) => void;
  debounceListRenderMS?: number;
  vid?: string;
  resetTopWhenDataChange?: boolean;
}): any {
  const { vid = DEFAULT_VID, height, onReachEnd, onScroll, onListRender, resetTopWhenDataChange = false } = props;
  const resetScrollTopWhenDataChange = onReachEnd ? false : resetTopWhenDataChange;
  if (!vidMap.has(vid)) {
    vidMap.set(vid, { _id: vid });
  }
  return {
    table: (p) =>
      VTable(p, {
        vid,
        scrollY: height,
        reachEnd: onReachEnd,
        onScroll,
        onListRender,
        resetScrollTopWhenDataChange,
      }),
    body: {
      wrapper: VWrapper,
      row: VRow,
      cell: VCell,
    },
  };
}

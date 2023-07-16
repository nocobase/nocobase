import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Breadcrumb, Segmented, Switch } from 'antd';
import classNames from 'classnames';
import type { CSSProperties, FC } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterMode } from '../FilterPanel';
import type { Theme, TokenName } from '../interface';
import makeStyle from '../utils/makeStyle';
import { getRelatedComponents } from '../utils/statistic';
import { getComponentDemoId } from './ComponentCard';
import ComponentDemoGroup from './ComponentDemoGroup';
import ComponentTree from './ComponentTree';

const BREADCRUMB_HEIGHT = 40;

const useStyle = makeStyle('ComponentPanel', (token) => ({
  '.component-panel': {
    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(25,15,15,0.07), 0 0 1px 0 rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    display: 'flex',
    borderRadius: 6,
    height: '100%',
    overflow: 'hidden',

    '.component-panel-main': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      width: 0,

      '.component-panel-head': {
        padding: `${token.paddingSM}px ${token.paddingSM}px`,
        flex: 'none',
        backgroundColor: token.colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBgContainer}`,

        '> *:not(:first-child)': {
          marginInlineStart: token.margin,
        },

        [`${token.rootCls}-segmented-item`]: {
          minWidth: 52,
        },
      },

      '.component-panel-toggle-side-icon': {
        flex: 'none',
        cursor: 'pointer',
        marginInlineEnd: token.marginXS,

        '.anticon': {
          color: token.colorIcon,
          transition: `color ${token.motionDurationMid}`,

          '&:hover': {
            color: token.colorIconHover,
          },
        },
      },
    },

    '.component-panel-side': {
      flex: 'none',
      width: 200,
      overflow: 'hidden',
      transition: `transform ${token.motionDurationMid}, width ${token.motionDurationMid}`,
    },

    '.component-panel-side.component-panel-side-hidden': {
      width: 0,
      transform: 'translateX(-200px)',
    },

    '.component-demos-wrapper': {
      display: 'flex',
      flex: 1,
      height: 0,
      position: 'relative',

      '.component-demos-breadcrumb-wrapper': {
        position: 'absolute',
        top: 0,
        insetInlineStart: 0,
        width: '100%',
        height: BREADCRUMB_HEIGHT,
        zIndex: 20,
        backgroundColor: token.colorBgContainer,
        padding: '8px 16px',
        transition: 'opacity 0.3s',
        background: 'rgba(255, 255, 255, .6)',
        backdropFilter: 'blur(10px)',
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBgContainer}`,
      },
    },

    '.component-demos': {
      height: '100%',
      overflow: 'auto',
      flex: 1,
    },
  },
}));

export const antdComponents = {
  General: ['Button', 'Icon', 'Typography'],
  Layout: ['Divider', 'Grid', 'Space'],
  Navigation: ['Breadcrumb', 'Dropdown', 'Menu', 'Pagination', 'Steps'],
  'Date Entry': [
    'AutoComplete',
    'Cascader',
    'Checkbox',
    'DatePicker',
    'Form',
    'Input',
    'InputNumber',
    'Mentions',
    'Radio',
    'Rate',
    'Select',
    'Slider',
    'Switch',
    'TimePicker',
    'Transfer',
    'TreeSelect',
    'Upload',
  ],
  'Data Display': [
    'Avatar',
    'Badge',
    'Calendar',
    'Card',
    'Carousel',
    'Collapse',
    'Descriptions',
    'Empty',
    'Image',
    'List',
    'Popover',
    'Segmented',
    'Statistic',
    'Table',
    'Tabs',
    'Tag',
    'Timeline',
    'Tooltip',
    'Tree',
  ],
  Feedback: [
    'Alert',
    'Drawer',
    'Message',
    'Modal',
    'Notification',
    'Popconfirm',
    'Progress',
    'Result',
    'Skeleton',
    'Spin',
  ],
  Other: ['Anchor'],
};

export type ComponentPanelProps = {
  themes: Theme[];
  selectedTokens?: string[];
  filterMode?: FilterMode;
  className?: string;
  style?: CSSProperties;
  onTokenClick?: (token: TokenName) => void;
};

const Index: FC<ComponentPanelProps> = ({ themes, selectedTokens, filterMode, className, onTokenClick, ...rest }) => {
  const [wrapSSR, hashId] = useStyle();
  const [showSide, setShowSide] = useState<boolean>(true);
  const demosRef = useRef<HTMLDivElement>(null);
  const [componentSize, setComponentSize] = useState<'large' | 'small' | 'middle'>('middle');
  const [componentDisabled, setComponentDisabled] = useState<boolean>(false);
  const [activeComponent, setActiveComponent] = useState<string | undefined>();
  const [showBreadcrumb, setShowBreadcrumb] = useState<boolean>(false);

  const relatedComponents = useMemo(() => {
    return selectedTokens ? getRelatedComponents(selectedTokens) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTokens]);

  useEffect(() => {
    setShowSide(true);
  }, [selectedTokens]);

  useEffect(() => {
    const handleScroll = () => {
      if (demosRef.current) {
        setShowBreadcrumb(demosRef.current.scrollTop > 10);
        for (let i = 0; i < demosRef.current.children.length; i++) {
          if (
            demosRef.current.children[i].getBoundingClientRect().top +
              demosRef.current.children[i].clientHeight -
              demosRef.current.getBoundingClientRect().top >
            BREADCRUMB_HEIGHT
          ) {
            setActiveComponent(demosRef.current.children[i]?.id.split('-').pop());
            break;
          }
        }
      }
    };

    demosRef.current?.addEventListener('scroll', handleScroll);
    const demosWrapper = demosRef.current;
    return () => {
      demosWrapper?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToComponent = (component: string) => {
    demosRef.current?.scrollTo({
      top: (demosRef.current?.querySelector<HTMLElement>(`#${getComponentDemoId(component)}`)?.offsetTop || 0) - 38,
      behavior: 'smooth',
    });
  };

  const activeComponentCategory = useMemo(() => {
    if (!activeComponent) {
      return undefined;
    }
    const key = Object.entries(antdComponents).find(([, value]) => value.includes(activeComponent))?.[0];
    if (key) {
      return (antdComponents as any)[key];
    } else {
      return undefined;
    }
  }, [activeComponent]);

  const demoGroup = useMemo(
    () => (
      <ComponentDemoGroup
        themes={themes}
        components={antdComponents}
        size={componentSize}
        disabled={componentDisabled}
        activeComponents={filterMode === 'highlight' ? undefined : relatedComponents}
        selectedTokens={selectedTokens}
        onTokenClick={onTokenClick}
      />
    ),
    [themes, componentSize, componentDisabled, filterMode, relatedComponents, selectedTokens, onTokenClick],
  );

  return wrapSSR(
    <div className={classNames('component-panel', hashId, className)} {...rest}>
      <div
        className={classNames('component-panel-side', {
          'component-panel-side-hidden': !showSide,
        })}
      >
        <ComponentTree
          activeComponent={activeComponent}
          filterMode={filterMode}
          selectedTokens={selectedTokens}
          components={antdComponents}
          onSelect={(component) => {
            if (component.startsWith('type-')) {
              scrollToComponent((antdComponents as any)[component.split('-')[1]][0]);
            } else {
              scrollToComponent(component);
            }
          }}
        />
      </div>
      <div className="component-panel-main">
        <div className="component-panel-head">
          <div className="component-panel-toggle-side-icon" onClick={() => setShowSide((prev) => !prev)}>
            {showSide ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </div>
          <div>
            <span style={{ marginRight: 8 }}>组件尺寸：</span>
            <Segmented
              value={componentSize}
              onChange={(value) => setComponentSize(value as any)}
              options={[
                { label: '大', value: 'large' },
                { label: '中', value: 'middle' },
                { label: '小', value: 'small' },
              ]}
            />
          </div>
          <div>
            <span style={{ marginRight: 8, verticalAlign: 'middle' }}>禁用：</span>
            <Switch checked={componentDisabled} onChange={(checked) => setComponentDisabled(checked)} />
          </div>
        </div>
        <div className="component-demos-wrapper">
          {activeComponent && (
            <div className="component-demos-breadcrumb-wrapper" style={{ opacity: showBreadcrumb ? 1 : 0 }}>
              <Breadcrumb>
                <Breadcrumb.Item>
                  <a onClick={() => activeComponentCategory && scrollToComponent(activeComponentCategory?.[0])}>
                    {Object.entries(antdComponents).find(([, value]) => value.includes(activeComponent))?.[0]}
                  </a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{activeComponent}</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          )}
          <div className="component-demos" ref={demosRef}>
            {demoGroup}
          </div>
        </div>
      </div>
    </div>,
  );
};

export default Index;

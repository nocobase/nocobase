import { DownOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Anchor, Col, Layout, Menu, Row, Table, Tag, Tree } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRequest } from '../../api-client';
import { Plugin } from '../../application/Plugin';
import { useGlobalTheme } from '../../global-theme';
import { useStyles } from '../../schema-component/antd/markdown/style';
import { useParseMarkdown } from '../../schema-component/antd/markdown/util';

const { Header, Sider, Content } = Layout;

const arrDiff = (arr1: any[], arr2: any[]) => {
  const difference = arr1.filter((x) => !arr2.includes(x)).concat(arr2.filter((x) => !arr1.includes(x)));
  return difference;
};

function toTree(items) {
  const tree = [];

  let prev;
  let current;

  for (const item of items) {
    if (!current) {
      current = item;
    }
    if (item.tag === current.tag) {
      current = item;
      current.children = [];
      current.href = `#${current.key}`;
      tree.push(current);
    } else {
      current.children.push(item);
    }
    prev = item;
  }

  for (const node of tree) {
    node.children = toTree(node.children);
  }

  return tree;
}

const Doc = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const defaultKey = location.pathname.replace(/^\/doc\//g, '');
  const keys = defaultKey.split('/');

  const openKeys = [];
  let prev = '';
  for (const key of keys) {
    prev = prev ? `${prev}/${key}` : key;
    openKeys.push(prev);
  }
  console.log(openKeys);
  const [oKeys, setOKeys] = useState(openKeys);
  const { data, loading } = useRequest({
    url: 'pm:getDocMenu',
  });
  if (loading) {
    return;
  }
  const transform = (items) => {
    return items.map((item) => {
      if (item.packageName) {
        item.label = (
          <div>
            <div style={{ lineHeight: 1 }} className={'label'}>
              {item.displayName}
            </div>
            <div style={{ lineHeight: 1, opacity: 0.5, fontSize: '.6rem', marginTop: 5 }} className={'package-name'}>
              {item.packageName}
            </div>
          </div>
        );
      }
      if (item.children) {
        item.children = transform(item.children);
      }
      return item;
    });
  };
  return (
    <div>
      <Layout style={{ background: 'none' }}>
        <Header
          className={css`
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            background: rgb(255, 255, 255);
            box-shadow:
              rgba(0, 0, 0, 0.03) 0px 1px 2px 0px,
              rgba(0, 0, 0, 0.02) 0px 1px 6px -1px,
              rgba(0, 0, 0, 0.02) 0px 2px 4px 0px;
            .logo {
              height: 32px;
              margin-right: 12px;
              vertical-align: middle;
            }
          `}
        >
          <img className={'logo'} alt="logo" src="https://www.nocobase.com/images/logo.png" />
        </Header>
        <Layout
          className={css`
            background: none;
            padding-top: 64px;
          `}
        >
          <Sider
            theme={'light'}
            width={350}
            style={{
              overflow: 'auto',
              height: 'calc(100vh - 64px)',
              position: 'fixed',
              left: 0,
              top: 64,
              bottom: 0,
            }}
            className={css`
              .ant-menu-root {
                overflow: auto;
                padding-top: 24px;
                padding-bottom: 24px;
                > .ant-menu-item-group {
                  > .ant-menu-item-group-list {
                    > .ant-menu-submenu {
                      > .ant-menu-sub {
                        background: rgba(0, 0, 0, 0.02) !important;
                      }
                    }
                  }
                }
              }
            `}
          >
            {/* <div style={{ background: '#fff', textAlign: 'center' }}>
            <img style={{ height: 30 }} src="https://www.nocobase.com/images/logo.png" />
          </div> */}
            <Menu
              mode="inline"
              selectedKeys={[defaultKey]}
              openKeys={openKeys}
              style={{ height: '100%' }}
              onClick={(info) => {
                navigate(`/doc/${info.key}`);
              }}
              className={css`
                &.ant-menu-inline > .ant-menu-item-group > .ant-menu-item-group-title {
                  &::after {
                    position: relative;
                    top: 12px;
                    display: block;
                    width: 100%;
                    height: 1px;
                    background: rgba(5, 5, 5, 0.06);
                    content: '';
                  }
                  padding-left: 28px;
                  margin-bottom: 1rem;
                  margin-top: 0.5rem;
                }
                .ant-menu-sub.ant-menu-inline {
                  background: none !important;
                }
                .ant-menu-submenu-selected:not(.last) > .ant-menu-submenu-title {
                  color: inherit !important;
                }
                .ant-menu-submenu-selected.last > .ant-menu-submenu-title {
                  background-color: #e6f4ff;
                }
              `}
              onOpenChange={(values) => {
                const diff = arrDiff(values, openKeys);
                setOKeys(diff);
                navigate(`/doc/${diff[0]}`);
              }}
              _internalRenderMenuItem={(origin) => {
                return origin;
              }}
              _internalRenderSubMenuItem={(origin, subMenuItemProps, stateProps) => {
                return React.cloneElement(origin, {
                  className:
                    subMenuItemProps.eventKey === defaultKey
                      ? `${origin.props.className} last`
                      : origin.props.className,
                });
              }}
              items={transform(data?.['data'] || [])}
            />
          </Sider>
          <Content
            className={css`
              background: none;
              padding: 24px;
            `}
            style={{ marginLeft: 350, minHeight: 350 }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

const Markdown = ({ html }) => {
  const { isDarkTheme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles({ isDarkTheme });

  return (
    <div
      className={classNames('nb-markdown nb-markdown-default nb-markdown-table', 'markdown', componentCls, hashId)}
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
  );
};

const MarkdownContent = () => {
  const params = useParams();
  const { html, loading: loading1, setText } = useParseMarkdown('');
  const { loading } = useRequest(
    {
      url: 'pm:getDoc',
      params: {
        path: params['*'],
      },
    },
    {
      refreshDeps: [params['*']],
      onSuccess(data) {
        setText(data?.data?.content || '');
      },
    },
  );
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (loading1 || loading) {
      return;
    }
    const list = document.querySelectorAll('.markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6');
    setItems(toTree([...list].map((item: any) => ({ title: item.innerText, tag: item.nodeName, key: item.id }))));
  }, [loading1, loading]);
  if (loading1 || loading) {
    return null;
  }
  return (
    <div>
      <Row gutter={24}>
        <Col span={items.length > 0 ? 20 : 24}>
          <Markdown html={html} />
        </Col>
        {items.length > 0 && (
          <Col span={4}>
            <Anchor replace offsetTop={100} targetOffset={100} items={items} />
          </Col>
        )}
      </Row>
    </div>
  );
};

const isPkg = (path) => {
  const len = path.split('/').length;
  if (len === 0) {
    return true;
  }
  if (path.startsWith('@') && len == 2) {
    return true;
  }
  return false;
};

const PackagePage = ({ packageName }) => {
  const { loading, data } = useRequest(
    {
      url: 'pm:getByPkg',
      params: {
        packageName,
      },
    },
    {
      refreshDeps: [packageName],
    },
  );
  if (loading) {
    return null;
  }
  if (!data) {
    return null;
  }
  const plugin = data['data'];
  return (
    <div>
      <h1>
        <div className={'display-name'}>{plugin.displayName} </div>
        <div className={'package-name'}>{plugin.packageName}</div>
      </h1>
      <div>0.14.0-alpha.3 • 最后更新 8 天前</div>
      <h2>介绍</h2>
      <div>{plugin.description}</div>
      {/* <Descriptions bordered size={'small'} layout="vertical" items={items} /> */}
      <h2>安装</h2>
      <pre>
        <code className={'hljs language-bash'}>yarn pm add {plugin.packageName}</code>
      </pre>
      <h2>目录</h2>
      <Tree
        showLine
        defaultExpandAll
        switcherIcon={<DownOutlined />}
        treeData={plugin.toc}
        fieldNames={{ title: 'label', key: 'key', children: 'children' }}
      />
    </div>
  );
};

const PluginPage = () => {
  const params = useParams();
  const path = params['*'];
  return isPkg(path) ? <PackagePage packageName={path} /> : <MarkdownContent />;
};

const PluginTags = () => {
  const params = useParams();
  return params['*'] ? <MarkdownContent /> : <PluginTag />;
};

const PluginTag = () => {
  const params = useParams();
  return (
    <div>
      <h1>{params.tag}</h1>
      <h2>相关文档</h2>
    </div>
  );
};

const OverviewPage = () => {
  const { data, loading } = useRequest<any>({
    url: 'pm:getDocData',
  });
  const navigate = useNavigate();
  if (loading) {
    return null;
  }
  const tags = data?.data?.['tags'] || [];
  const plugins = data?.data?.['plugins'] || [];
  return (
    <div
      className={css`
        h2 {
          margin: 24px 0;
        }
        .plugin-link {
          color: inherit;
        }
        .package-name {
          font-size: 0.7rem;
        }
        .ant-table-cell {
          cursor: pointer;
        }
        .ant-table-row:hover td {
          background: #e6f4ff !important;
        }
      `}
    >
      <h1>总览</h1>
      <h2>标签</h2>
      {tags.map((tag, index) => {
        return (
          <Link key={index} to={`/doc/tags/${tag.key}`}>
            <Tag>{tag.title}</Tag>
          </Link>
        );
      })}
      <h2>插件</h2>
      <Table
        size={'middle'}
        pagination={false}
        onRow={(data) => {
          return {
            onClick() {
              navigate(`/doc/plugins/${data.packageName}`);
            },
          };
        }}
        columns={[
          {
            title: 'Plugin',
            width: 300,
            dataIndex: 'displayName',
            ellipsis: true,
            render: (displayName, record) => {
              return (
                <Link className={'plugin-link'} to={`/doc/plugins/${record.packageName}`}>
                  <div className={'display-name'}>{displayName}</div>
                  <div className={'package-name'}>{record.packageName}</div>
                </Link>
              );
            },
          },
          {
            title: 'Version',
            dataIndex: 'version',
            ellipsis: true,
            width: 200,
          },
          {
            title: 'Description',
            dataIndex: 'description',
            ellipsis: true,
          },
        ]}
        dataSource={plugins}
      />
    </div>
  );
};

export class DocPlugin extends Plugin {
  async load() {
    this.router.add('doc', {
      path: 'doc/*',
      Component: Doc,
    });
    this.router.add('doc.overview', {
      path: 'overview',
      Component: OverviewPage,
    });
    // this.router.add('doc.guide', {
    //   path: 'guide',
    //   Component: PluginSwaggerPage,
    // });
    this.router.add('doc.plugins', {
      path: 'plugins/*',
      Component: PluginPage,
    });
    this.router.add('doc.tags', {
      path: 'tags/:tag/*',
      Component: PluginTags,
    });
  }
}

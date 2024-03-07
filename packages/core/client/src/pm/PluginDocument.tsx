import { Spin } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useRequest } from '../api-client';
import { useStyles as useMarkdownStyles } from '../schema-component/antd/markdown/style';
import { useParseMarkdown } from '../schema-component/antd/markdown/util';
import { useStyles } from './style';
import { useGlobalTheme } from '../global-theme';

const PLUGIN_STATICS_PATH = '/static/plugins/';

interface PluginDocumentProps {
  url: string;
  packageName?: string;
}

export const PluginDocument: React.FC<PluginDocumentProps> = memo((props) => {
  const { isDarkTheme } = useGlobalTheme();
  const { componentCls, hashId } = useMarkdownStyles({ isDarkTheme });
  const { styles } = useStyles();
  const { url, packageName } = props;
  const [docUrl, setDocUrl] = useState(url);
  const { data, loading, error } = useRequest<string>(
    { url: docUrl, baseURL: '/' },
    {
      refreshDeps: [docUrl],
    },
  );
  const { html, loading: parseLoading } = useParseMarkdown(data);

  const htmlWithOutRelativeDirect = useMemo(() => {
    if (html) {
      let res = html;
      const pattern = /<a\s+href="\..*?\/([^/]+)"/g;
      res = res.replace(pattern, (match, $1) => match + `onclick="return false;"`); // prevent the default event of <a/>

      // replace img src
      res = res.replace(/src="(.*?)"/g, (match, src: string) => {
        if (src.startsWith('http') || src.startsWith('//:')) return match;
        return `src="${PLUGIN_STATICS_PATH}${packageName}/${src}"`;
      });
      return res;
    }
    return '';
  }, [html, packageName]);

  const handleSwitchDocLang = useCallback((e: MouseEvent) => {
    const url = (e.target as HTMLDivElement).getAttribute('href');
    if (!url) return;
    const parsedUrl = new URL(docUrl, window.location.origin);
    const combinedUrl = new URL(url, parsedUrl);
    setDocUrl(combinedUrl.pathname);
  }, []);

  useEffect(() => {
    const md = document.getElementById('pm-md-preview');
    md.addEventListener('click', handleSwitchDocLang);
    return () => {
      removeEventListener('click', handleSwitchDocLang);
    };
  }, [handleSwitchDocLang]);

  return (
    <div className={styles.PluginDocument} id="pm-md-preview">
      {loading || parseLoading ? (
        <Spin />
      ) : (
        <div
          className={`${componentCls} ${hashId} nb-markdown nb-markdown-default nb-markdown-table`}
          dangerouslySetInnerHTML={{ __html: error ? '' : htmlWithOutRelativeDirect }}
        ></div>
      )}
    </div>
  );
});
PluginDocument.displayName = 'PluginDocument';

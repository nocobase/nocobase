import { Spin } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useRequest } from '../api-client';
import { useStyles as useMarkdownStyles } from '../schema-component/antd/markdown/style';
import { useParseMarkdown } from '../schema-component/antd/markdown/util';
import { useStyles } from './style';

interface PluginDocumentProps {
  url: string;
}

export const PluginDocument: React.FC<PluginDocumentProps> = memo((props) => {
  const { hashId, componentCls } = useMarkdownStyles();
  const { styles } = useStyles();
  const { url } = props;
  const [docUrl, setDocUrl] = useState(url);
  const { data, loading, error } = useRequest<string>(
    { url: docUrl },
    {
      refreshDeps: [docUrl],
    },
  );
  const { html, loading: parseLoading } = useParseMarkdown(data);

  const htmlWithOutRelativeDirect = useMemo(() => {
    if (html) {
      const pattern = /<a\s+href="\..*?\/([^/]+)"/g;
      return html.replace(pattern, (match, $1) => match + `onclick="return false;"`); // prevent the default event of <a/>
    }
    return '';
  }, [html]);

  const handleSwitchDocLang = useCallback((e: MouseEvent) => {
    const lang = (e.target as HTMLDivElement).innerHTML;
    if (lang.trim() === '中文') {
      setDocUrl('zh-CN');
    } else if (lang.trim() === 'English') {
      setDocUrl('en-US');
    }
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

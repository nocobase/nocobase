import React, { useState, useEffect, useRef } from 'react';
import { useSearch, AnchorLink } from 'dumi/theme';
import './SearchBar.less';

export default () => {
  const [keywords, setKeywords] = useState<string>('');
  const [items, setItems] = useState([]);
  const input = useRef<HTMLInputElement>();
  const result = useSearch(keywords);

  useEffect(() => {
    if (Array.isArray(result)) {
      setItems(result);
    } else if (typeof result === 'function') {
      result(`.${input.current.className}`);
    }
  }, [result]);

  return (
    <div className="__dumi-default-search">
      <input
        className="__dumi-default-search-input"
        type="search"
        ref={input}
        {...(Array.isArray(result)
          ? { value: keywords, onChange: ev => setKeywords(ev.target.value) }
          : {})}
      />
      <ul>
        {items.map(meta => (
          <li key={meta.path} onClick={() => setKeywords('')}>
            <AnchorLink to={meta.path}>
              {meta.parent?.title && <span>{meta.parent.title}</span>}
              {meta.title}
            </AnchorLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Mentions, MentionProps } from 'antd';
import { OptionProps } from 'antd/es/mentions/index';
import { useResource } from '@nocobase/client';
import { useCommentTranslation } from '../locale';

export interface StructMentionsValue {
  content: string;
  ats: string[];
}

export type StructMentionsProps = Omit<MentionProps, 'value' | 'onChange' | 'children'> & {
  value?: string;
  onChange?: (value: string) => void;
  commentUsers?: any[];
};

export const StructMentions = (props: StructMentionsProps) => {
  const { value, onChange, commentUsers = [] } = props;

  const { t } = useCommentTranslation();
  const [mentions, setMentions] = useState([]);
  const [mentionsLoading, setMentionsLoading] = useState(false);
  const [ats, setAts] = useState(commentUsers);
  const { list } = useResource('users');

  const textareaRef = useRef<{ textarea: HTMLTextAreaElement }>();

  let overrideValue = value ?? '';

  for (let at of ats) {
    const reg = createReg(at.id, 'g');
    overrideValue = overrideValue.replace(reg, (match, p1) => {
      return `@${at.nickname ?? p1}`;
    });
  }

  const overrideOnChange = (content: string) => {
    for (let at of ats) {
      content = content.replace(`@${at.nickname}`, `{{at ${at.id}}}`);
    }
    onChange(content);
  };

  const handleMentionSearch = async (search: string) => {
    setMentionsLoading(true);
    const { data } = await list();
    setMentions(data.data ?? []);
    setMentionsLoading(false);
  };

  const handleSelect = (option: OptionProps, prefix: string) => {
    setAts([...ats, mentions.find((i) => i.nickname === option.value)]);
  };

  return (
    <Mentions
      ref={textareaRef as any}
      value={overrideValue}
      onChange={overrideOnChange}
      rows={3}
      placeholder={t('You can use @ to ref user here')}
      onSearch={handleMentionSearch}
      onSelect={handleSelect}
      loading={mentionsLoading}
    >
      {mentions.map((m: { nickname: string; id: string }) => (
        <Mentions.Option key={m.id} value={m.nickname}>
          {m.nickname}
        </Mentions.Option>
      ))}
    </Mentions>
  );
};

export const createReg = (id: string, flag?: string) => new RegExp(`\\{\\{at (${id})\\}\\}`, flag);

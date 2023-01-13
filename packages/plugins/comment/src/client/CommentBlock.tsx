import React from 'react';
import { Comment, Divider, Form, Button, Empty, Modal } from 'antd';
import { CommentBlockDesigner } from './CommentBlock.Designer';
import { useCommentTranslation } from './locale';
import { CommentBlockDecorator } from './CommentBlock.Decorator';
import { useCollection, useCurrentUserContext, useRecord, useRequest, useResource } from '@nocobase/client';
import { createReg, StructMentions } from './components/StructMentions';

let id = 0;

export interface User {
  nickname: string;
  id: number;
}

export interface CommentItem {
  id: string;
  commenter: User;
  commentUsers: User[];
  content: string;
}

export const CommentBlock = (props) => {
  const { t } = useCommentTranslation();
  const [form] = Form.useForm();

  const collection = useCollection();
  const record = useRecord();
  const { data: currentUserData } = useCurrentUserContext();

  const currentUserId = currentUserData.data.id;

  const { create, destroy } = useResource('comments');

  const { data, loading, refresh } = useRequest({
    resource: 'comments',
    action: 'list',
    params: {
      paginate: false,
      filter: {
        collectioName: collection.name,
        recordId: record.id,
      },
      appends: ['commenter', 'commentUsers'],
    },
  });

  const commentList = data?.data ?? [];

  const handleFinish = async () => {
    const formValues = form.getFieldsValue();

    const reg = createReg('.*?', 'g');
    const atIds = [];

    formValues.content.replace(reg, (match, p1) => atIds.push(~~p1));

    const commentUsers = Array.from(new Set([...atIds]));

    await create({
      values: {
        collectioName: collection.name,
        recordId: record.id,
        content: formValues.content,
        commenter: currentUserId,
        commentUsers,
      },
    });
    form.resetFields();
    refresh();
  };

  const handleDelete = async (item: CommentItem) => {
    Modal.confirm({
      title: '删除评论',
      content: '你确定要删除吗？',
      onOk: async () => {
        await destroy({
          filterByTk: item.id,
        });
        refresh();
      },
    });
  };

  const handleEdit = async (item: CommentItem) => {};

  const getContent = (item: CommentItem) => {
    const reg = createReg('.*?', 'g');
    const replaces = [];
    let plainText = item.content.replace(reg, (match, p1) => {
      const name = item.commentUsers.find((i) => i.id === ~~p1)?.nickname ?? p1;
      replaces.push(`@${name}`);
      return `@${name}`;
    });

    if (replaces.length) {
      let splits = [];
      for (let r of replaces) {
        const index = plainText.search(r);
        const before = plainText.slice(0, index);
        const main = <a key={id++}>{plainText.slice(index, index + r.length)}</a>;
        plainText = plainText.slice(index + r.length);
        splits.push(before, main);
      }
      splits.push(plainText);

      return splits.filter((i) => i);
    } else {
      return plainText;
    }
  };

  return (
    <div>
      {!loading && commentList.length ? (
        commentList.map((i: CommentItem) => (
          <Comment
            key={i.id}
            actions={[
              <span key="comment-edit" onClick={() => handleEdit(i)}>
                {t('Edit')}
              </span>,
              <span key="comment-delete" onClick={() => handleDelete(i)}>
                {t('Delete')}
              </span>,
            ]}
            author={<a>{i.commenter.nickname}</a>}
            content={<p>{getContent(i)}</p>}
          />
        ))
      ) : (
        <Empty description="暂无评论" />
      )}
      <Divider />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="content">
          <StructMentions />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            {t('Comment')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

CommentBlock.Designer = CommentBlockDesigner;
CommentBlock.Decorator = CommentBlockDecorator;

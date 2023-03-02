import React, { useState, createElement, useEffect } from 'react';
import { Comment, Divider, Form, Button, Empty, Modal, Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { CommentBlockDesigner } from './CommentBlock.Designer';
import { useCommentTranslation } from '../locale';
import { CommentBlockDecorator } from './CommentBlock.Decorator';
import {
  ReadPretty,
  useAPIClient,
  useCollection,
  useCurrentUserContext,
  useRecord,
  useRequest,
  useResource,
} from '@nocobase/client';
import { createReg, StructMentions } from '../components/StructMentions';
import moment from 'moment';

let id = 0;

export interface User {
  nickname: string;
  id: number;
}

export interface CommentItem {
  id: string;
  createdBy: User;
  mentionUsers: User[];
  content: string;
  updatedAt: string;
}

export const CommentBlock = (props) => {
  const { t } = useCommentTranslation();
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const collection = useCollection();
  const record = useRecord();
  const { data: currentUserData } = useCurrentUserContext();
  const api = useAPIClient();

  let collectionName = collection.name;
  let recordId = record.id;

  if (props.from === 'commentRecord') {
    collectionName = record.collectionName;
    recordId = record.recordId;
  }

  const currentUserId = currentUserData.data.id;

  const { create, update, destroy } = useResource('comments');

  const { data, loading, refresh } = useRequest({
    resource: 'comments',
    action: 'list',
    params: {
      paginate: false,
      filter: {
        collectionName: collectionName,
        recordId: String(recordId),
      },
      sort: 'createdAt',
      appends: ['collection', 'createdBy', 'mentionUsers'],
    },
  });

  const commentList = data?.data ?? [];

  const handleFinish = async () => {
    const formValues = form.getFieldsValue();
    const mentionUsers = getMentionUsers(formValues.content);

    await create({
      values: {
        collectionName: collectionName,
        recordId: String(recordId),
        content: formValues.content,
        createdBy: currentUserId,
        mentionUsers: mentionUsers,
        recordTitle: record[collection.titleField ?? 'id'],
      },
    });
    form.resetFields();
    refresh();
  };

  const handleDelete = async (item: CommentItem) => {
    Modal.confirm({
      title: t('Delete comment'),
      content: t('Confirm delete?'),
      onOk: async () => {
        await destroy({
          filterByTk: item.id,
        });
        refresh();
      },
    });
  };

  const handleEdit = async (item: CommentItem) => {
    let commentValue = undefined;

    const handleOk = async () => {
      const mentionUsers = getMentionUsers(commentValue);

      await update({
        filterByTk: item.id,
        values: {
          content: commentValue,
          mentionUsers,
        },
      });
      form.resetFields();
      refresh();
    };

    modal.confirm({
      title: t('Edit'),
      icon: null,
      closeIcon: true,
      okCancel: true,
      maskClosable: true,
      onOk: handleOk,
      content: createElement(() => {
        const [value, setValue] = useState(item.content);

        useEffect(() => {
          commentValue = value;
        }, [value]);

        return <StructMentions mentionUsers={item.mentionUsers} value={value} onChange={(e) => setValue(e)} />;
      }),
    });
  };

  const isRootRole = api.auth.role === 'root';

  return (
    <div>
      {!loading && commentList.length ? (
        commentList.map((i: CommentItem) => (
          <Comment
            key={i.id}
            avatar={<Avatar icon={<UserOutlined />} />}
            datetime={
              <Tooltip title={moment(i.updatedAt).format('YYYY-MM-DD HH:mm:ss')}>
                <span>{moment(i.updatedAt).fromNow()}</span>
              </Tooltip>
            }
            actions={
              i.createdBy.id === currentUserId || isRootRole
                ? [
                    <span key="comment-edit" onClick={() => handleEdit(i)}>
                      {t('Edit')}
                    </span>,
                    <span key="comment-delete" onClick={() => handleDelete(i)}>
                      {t('Delete')}
                    </span>,
                  ]
                : []
            }
            author={<a>{i.createdBy.nickname}</a>}
            content={<ReadPretty.Html value={getContent(i)} />}
          />
        ))
      ) : (
        <Empty description={t('No comments')} />
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
      {contextHolder}
    </div>
  );
};

export const getMentionUsers = (content: string) => {
  const reg = createReg('.*?', 'g');
  const atIds: number[] = [];

  content.replace(reg, (match, p1) => atIds.push(~~p1) as unknown as string);

  const mentionUsers = Array.from(new Set([...atIds]));

  return mentionUsers;
};

export const getContent = (item: CommentItem) => {
  if (!item.mentionUsers) return item.content;
  const reg = createReg('.*?', 'g');
  const replaces = [];
  let plainText = item.content.replace(reg, (match, p1) => {
    const name = item.mentionUsers.find((i) => i.id === ~~p1)?.nickname ?? p1;
    replaces.push(`@${name}`);
    return `@${name}`;
  });

  if (replaces.length) {
    let splits = [];
    for (let r of replaces) {
      const index = plainText.search(r);
      const before = plainText.slice(0, index);
      const main = `<a>${plainText.slice(index, index + r.length)}</a>`;
      plainText = plainText.slice(index + r.length);
      splits.push(before, main);
    }
    splits.push(plainText);
    return splits.filter((i) => i).join('');
  } else {
    return plainText;
  }
};

CommentBlock.Designer = CommentBlockDesigner;
CommentBlock.Decorator = CommentBlockDecorator;

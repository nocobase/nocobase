import { observer, useField, useForm } from '@formily/react';
import {
  CollectionManagerContext,
  CollectionManagerProvider,
  SchemaComponent,
  BlockProvider,
  useCollection,
  useRecord,
  useBlockRequestContext,
  useRequest
} from '@nocobase/client';
import React, { useContext, useEffect } from 'react';
import { CommentDesigner } from './CommentDesigner';
import CommentComponent from './commentree';
import { APIClient } from '@nocobase/sdk';
import { message, Button } from 'antd';
import { defaultsDeep } from 'lodash';
import { useTranslation } from 'react-i18next';
import moment from 'moment'


const { protocol, hostname, port} = location
const api = new APIClient({
  baseURL: `${protocol}//${hostname}:${port}/api`,
});

const collection = {
  name: 'comment',
  title: '{{t("Comment")}}',
  fields: [
    {
      name: 'createdAt',
      type: 'date',
      interface: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
        'x-read-pretty': true,
      },
    },
    {
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Action type")}}',
        'x-component': 'Select',
        'x-read-pretty': true,
        enum: [
          { label: '{{t("Create record")}}', value: 'create', color: 'lime' },
          { label: '{{t("Update record")}}', value: 'update', color: 'gold' },
          { label: '{{t("Delete record")}}', value: 'destroy', color: 'magenta' },
        ],
      },
    },
  ],
};

const progress = (data) => {
    const tree = [];
    const len = data.length;
    if(!len) return data;
    for(let i=0;i<len;i++){
      const node = data[i];
      const { path, createdAt } = node;
      const now = new Date().getTime() / 1000;
      const currentTime = new Date(createdAt).getTime() / 1000;
      const diffTime = now - currentTime;
      const createdAtFormat = diffTime < 60 ? '刚刚' :
                              diffTime >= 60 &&  diffTime < 3600 ? `${(diffTime / 60).toFixed(0)} 分钟前` :
                              diffTime >= 3600 &&  diffTime < 86400 ? `${(diffTime / 3600).toFixed(0)} 小时前` :
                              moment(createdAt).format('YYYY年MM月DD日 HH时mm分ss秒');
      node.createdAtFormat = createdAtFormat
      if( path.indexOf('-') === -1 ){
        if(tree[Number(path)]){
          tree[Number(path)] = defaultsDeep(node,tree[Number(path)]);
        }else{
          tree[Number(path)] = node
        }
      }else{
        const paths = path.split('-');
        const { length } = paths;
        let tempTree = {};
        for(let j=0; j<length; j++ ){
          const k = paths[j]
          if(j===0){
            if(tree[Number(k)]){
              tempTree = tree[Number(k)];
            }else{
              tempTree = tree[Number(k)] = {
                children:[]
              }
            }
          }else if(j===length-1){
            if(!tempTree['children']){
              tempTree['children'] = []
            }
            tempTree['children'][Number(k)] = defaultsDeep(node,tempTree['children'][Number(k)]);
          }else{
            if(!tempTree['children']){
              tempTree['children'] = []
            }
            if(tempTree['children'][Number(k)]){
              tempTree = tempTree['children'][Number(k)]
            }else{
              tempTree = tempTree['children'][Number(k)] = {}
            }
          }
        }
      }
    }
    console.log('tree',tree);
    const splices = [];
    tree.map((node,index)=>{
      if(!node.id || !node.createdAt){
        splices.push(index);
      }
    })
    splices.sort((a, b) => b - a);
    splices.map(o=>{
      tree.splice(o,1);
    })
    return tree;
}
const sortData = (data) => {
  if(!data.length) return data;
  data.sort((a,b)=>{
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      if(aDate>bDate){
        return -1;
      }
      if(aDate<bDate){
        return 1;
      }
      return 0
  })
  data.map(node=>{
    if(node.children){
      node.children = sortData(node.children);
    }
  })
  return data;
}

export const Comment: any = observer(() => {
  const { t } = useTranslation('plugin-comment');
  const userRes = useRequest({
    url: 'users:check',
  });
  const field = useField();
  const form = useForm();
  const totalField = form.createField({ name: 'total' });
  const userField = form.createField({ name: 'user' });
  const ctx = useBlockRequestContext();
  let data = ctx?.service?.data?.data || [];
  const count = ctx?.service?.data?.meta?.count || 0;
  const pageSize = ctx?.service?.params[0]?.pageSize || 0;
  useEffect(() => {
    if (!ctx?.service?.loading) {
      // console.log('重新发请求了');
      data = progress(ctx?.service?.data?.data || []);
      data = sortData(data);
      console.log('data',data);
      const commentListField = field.query('commentList').take();
      commentListField.setData(data);
      totalField.setValue(ctx?.service?.data?.meta?.count || 0)
    }
    if(!userRes?.loading){
      userField.setValue(userRes?.data?.data?.nickname || userRes?.data?.data?.email)
    }
  }, [ctx?.service?.loading, userRes?.loading]);
  const commit = async (type,node,payload) => {
    const { total, createdBy } = payload
    //console.log(type,node,text,total);
    const { path=null, children=[] } = node || {};
    const childrenLength = children?.length || 0;
    switch(type){
      case 'replay':{
        const { text } = payload
        const success = () => {
          message.success(t('Reply successfully'));
        };
        
        const fail = () => {
          message.error(t('Reply failure'));
        };
        if(!node){
          const res =  await api.request({
            url: 'comment:create',
            method: 'post',
            data: {
              like: 0,
              dislike: 0,
              content: text,
              path: total,
              createdBy,
            },
          });
          if(res.status===200){
            success();
            ctx.service.refresh();
          }else{
            fail();
          }
        }else{
          const res =  await api.request({
            url: 'comment:create',
            method: 'post',
            data: {
              like: 0,
              dislike: 0,
              content: text,
              path: `${path}-${childrenLength}`,
              createdBy,
            },
          });
          if(res.status===200){
            success();
            ctx.service.refresh();
          }else{
            fail();
          }
        }
        break;
      }

      case 'like':
      case 'dislike':{
        const success = () => {
          message.success(t('Update successfully'));
        };
        const fail = () => {
          message.error(t('Update failure'));
        };
        const res =  await api.request({
          url: 'comment:update',
          method: 'put',
          params:{
            filter:{
              id:node.id
            }
          },
          data: {
            [type]: node[type]+1,
            createdBy,
          },
        });
        if(res.status===200){
          success();
          ctx.service.refresh();
        }else{
          fail();
        }
        break;
      }

      default:{
        console.log('default');
      }
    }
    
  }
  const loadMove = (e:React.MouseEvent<Element>) => {
      e.stopPropagation();
      e.preventDefault();
      ctx.service.run(Object.assign(ctx.service.params[0], { pageSize: ctx.service.params[0].pageSize+20 } ))
  }
  return (
    <>
    <SchemaComponent
      memoized
      components={{ CommentComponent }}
      schema={{
        type: 'void',
        name: 'lfm4trkw8j3',
        'x-component': 'div',
        properties: {
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 16,
              },
            },
            properties: {
              filter: {
                type: 'void',
                title: '{{ t("Filter") }}',
                'x-action': 'filter',
                'x-component': 'Filter.Action',
                'x-component-props': {
                  icon: 'FilterOutlined',
                  useProps: '{{ useFilterActionProps }}',
                },
                'x-align': 'left',
              },
            },
          },
          commentList: {
            type: 'array',
            'x-component': 'CommentComponent',
            default: data,
            'x-component-props': {
               commit
            },
          },
        },
      }}
    />
    { pageSize < count && 
      <Button type="dashed" block onClick={loadMove}>
        {t('Load more')}
      </Button>
    }
    </>
  );
});

Comment.Decorator = observer((props: any) => {
  const parent = useCollection();
  const record = useRecord();
  const { interfaces } = useContext(CollectionManagerContext);
  let filter = props?.params?.filter;
  if (parent.name) {
    const filterByTk = record?.[parent.filterTargetKey || 'id'];
    if (filter) {
      filter = {
        $and: [filter, {
          collectionName: parent.name,
          recordId: `${filterByTk}`,
        }],
      };
    } else {
      filter = {
        collectionName: parent.name,
        recordId: `${filterByTk}`,
      };
    }
  }
  const defaults = {
    collection: 'comment',
    resource: 'comment',
    action: 'list',
    params: {
      pageSize: 20,
      //appends: ['collection', 'user'],
      ...props.params,
      filter,
      sort: '-createdAt',
    },
    rowKey: 'id',
    showIndex: true,
    dragSort: false,
  };
  return (
      <CollectionManagerProvider collections={[collection]} interfaces={interfaces}>
        <BlockProvider {...defaults}>{props.children}</BlockProvider>
      </CollectionManagerProvider>
  );
});

Comment.Designer = CommentDesigner;

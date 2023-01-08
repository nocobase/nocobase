
import { Avatar, Comment, Tooltip, Input, Button } from 'antd';
import { DislikeFilled, LikeFilled, UserOutlined } from '@ant-design/icons';
import React, { useState, useContext, createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { observer, useField, useForm } from '@formily/react';

const { TextArea } = Input;

interface CtreeProps {
    commit: any
    data: any
    [index:string]:any
}

const ShowreplyContext = createContext<any>(null);

const CommentTree = (props) => {
    const { t } = useTranslation('plugin-comment');
    let { data, commit, payload, isRoot } : CtreeProps = props;
    const {showreply,setShowreply} = useContext(ShowreplyContext);
    const [commenttext, setCommenttext] = useState('');
    const [initcommenttext,setInitcommenttext] = useState('');
    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>,isInit?:boolean) => {
        e.stopPropagation();
        e.preventDefault();
        if(isInit){
            setInitcommenttext(e.target.value);
        }else{
            setCommenttext(e.target.value);
        }
    };
    const toCancel = (e:React.MouseEvent<Element>) => {
        e.stopPropagation();
        e.preventDefault();
        setShowreply('')
        setCommenttext('');
    }
    const toSure = (e: React.MouseEvent,node:any) => {
        e.stopPropagation();
        e.preventDefault();
        
        if(!node){
            const newPayload = Object.assign({},payload,{text:initcommenttext})
            commit('replay',node,newPayload)
            setInitcommenttext('');
        }else{
            const newPayload = Object.assign({},payload,{text:commenttext})
            commit('replay',node,newPayload)
            setShowreply('')
            setCommenttext('');
        }
    }
    const toLike = (e: React.MouseEvent,type:string,node:any) => {
        e.stopPropagation();
        e.preventDefault();
        commit(type,node,payload)
    }
    const toShowreply = (e: React.MouseEvent,node:any) => {
        e.stopPropagation();
        e.preventDefault();
        if(showreply===node.path){
            setShowreply('')
        }else{
            setShowreply(node.path)
        }
    }
    const comments = data?.length?data.map((node) => {
        
        const hasChild = node.children?.length>0;
        const { 
            path,like,dislike,
            createdBy,createdAt,createdAtFormat,
            content, userImage } = node;
        const actions = [
            <Tooltip key="comment-basic-like" title={t("like")}>
              <span onClick={(e:React.MouseEvent)=>toLike(e,'like',node)}>
                <LikeFilled />
                <span className="comment-action">{t("like")} {like?like:0}</span>
              </span>
            </Tooltip>,
            <Tooltip key="comment-basic-dislike" title={t("dislike")}>
              <span onClick={(e:React.MouseEvent)=>toLike(e,'dislike',node)}>
                <DislikeFilled />
                <span className="comment-action">{t("dislike")} {dislike?dislike:0}</span>
              </span>
            </Tooltip>,
            <span key="comment-basic-reply-to" onClick={(e:React.MouseEvent)=>toShowreply(e,node)}>{t("Reply to")}</span>,
          ];
        return <Comment
                    key={node.id}
                    actions={actions}
                    author={<a>{createdBy}</a>}
                    avatar={
                        userImage ? 
                        <Avatar size='large' src="https://joeschmoe.io/api/v1/random" alt={createdBy} />:
                        <Avatar size='large' icon={<UserOutlined />} alt={createdBy} />
                    }
                    content={<p>{content}</p>}
                    datetime={
                    <Tooltip title={createdAtFormat || createdAt}>
                        <span>{createdAtFormat || createdAt}</span>
                    </Tooltip>
                    }>
                        { path === showreply && 
                            <>
                            <TextArea maxLength={1000} showCount style={{ height: 120 }} placeholder={ t("Reply to") + createdBy }
                            defaultValue={commenttext} value={commenttext} onChange={onChange} />
                            <div style={{textAlign:"end",margin:"22px 0 10px"}}>
                                <Button type="dashed" onClick={toCancel} style={{marginRight:'10px'}}>{t("cancel")}</Button>
                                <Button type="primary" 
                                disabled={ commenttext || commenttext.length>1000 ? false:true } 
                                onClick={(e:React.MouseEvent)=>{toSure(e,node);}}>{t("sure")}</Button>
                            </div>
                            </>
                        }
                        { hasChild && 
                            <CommentTree
                            commit={commit}
                            data={node.children}
                            payload={ payload }
                             />
                        }
                </Comment>
      }): null
      return <>
                { isRoot && 
                    <>
                        <TextArea maxLength={1000} showCount style={{ height: 120 }} placeholder={t("Please enter a comment")}
                            defaultValue={initcommenttext} value={initcommenttext} onChange={(e:React.ChangeEvent<HTMLTextAreaElement>)=>onChange(e,true)} />
                        <div style={{textAlign:"end",margin:"22px 0 10px"}}>
                            <Button type="primary" 
                            disabled={ initcommenttext || initcommenttext.length>1000 ? false:true } 
                            onClick={(e:React.MouseEvent)=>{toSure(e,null);}}>{t("sure")}</Button>
                        </div>
                    </>
                }
                {comments}
             </>
}

export default observer((props)=>{
    const field = useField();
    const form = useForm();
    const [showreply, setShowreply] = useState('');
    return <ShowreplyContext.Provider value={{showreply, setShowreply}}>
        <CommentTree {...props} data={field.data} isRoot
        payload={ { total: form.getValuesIn('total'), createdBy: form.getValuesIn('user') }} />
    </ShowreplyContext.Provider>
})
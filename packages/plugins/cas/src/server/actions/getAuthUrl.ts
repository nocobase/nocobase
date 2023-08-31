import { Context, Next } from '@nocobase/actions';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export const getAuthUrl = async (ctx: Context, next: Next) => {
  const { params } = ctx.action;
  // console.log('========params=1111111111==========',params)
  const casUrl = ctx.cookies.get('_sop_casUrl_');
  const getAuthUrl = ctx.cookies.get('_sop_loctionUrl_');
  // console.log('==================',`${casUrl}/serviceValidate?ticket=${params.ticket}&service=${getAuthUrl}/api/cas:getAuthUrl`)
  const res: any = await axios.get(
    `${casUrl}/serviceValidate?ticket=${params.ticket}&service=${getAuthUrl}/api/cas:getAuthUrl`,
  );
  // console.log('=========请求=======:',res.data)
  const pattern = /<(cas|sso):user>(.*?)<\/(cas|sso):user>/;
  const match = res.data.match(pattern);
  // console.log('=========match=======:',match)
  let userContent = void 0;
  const opts = {
    maxAge: 1000 * 3600 * 12,
    httpOnly: false,
  };
  if (match) {
    userContent = match[2];
    const token = jwt.sign({ nickname: userContent }, 'cas');
    ctx.cookies.set('_sop_session_', token, opts); //存储cookie
    ctx.cookies.set('_sop_mode_', 'CAS', opts); //存储cookie
    ctx.redirect('/signup?authType=CAS');
    ctx.body = await { data: '认证成功' };
  } else {
    console.log('No match found.');
    ctx.body = await { data: '认证失败' };
  }
  return next();
};

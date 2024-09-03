/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React, { FC, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSystemSettings, PoweredBy, useRequest, useAPIClient } from '@nocobase/client';
import { AuthenticatorsContext } from '../authenticator';
import { Input, Spin, Button } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import axios from 'axios';

export const AuthenticatorsContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useAPIClient();
  const {
    data: authenticators = [],
    error,
    loading,
  } = useRequest(() =>
    api
      .resource('authenticators')
      .publicList()
      .then((res) => {
        return res?.data?.data || [];
      }),
  );

  if (loading) {
    return <Spin />;
  }

  if (error) {
    throw error;
  }

  return <AuthenticatorsContext.Provider value={authenticators as any}>{children}</AuthenticatorsContext.Provider>;
};

import './js/tac';
import './css/tac.css';
import './css/AuthLayout.css';
// @ts-ignore
import logoUrl from './assets/logo.png';
import { useLWAuthContext } from '../basic/code';

export function AuthLayout() {
  const { data } = useSystemSettings();
  const { codeIsVisible, setCodeIsVisible, setLoginShow, changePassword, setChangePassword, LWuserID } =
    useLWAuthContext();
  const lwUrl = 'https://v8dev.lewanyun.com';
  useEffect(() => {
    if (codeIsVisible) {
      const configData = {
        // 生成接口
        requestCaptchaDataUrl: `${lwUrl}/magic/gen?type=SLIDER`,
        // 验证接口
        validCaptchaUrl: `${lwUrl}/magic/check`,
        // 验证码绑定的div块
        bindEl: '#captcha-box',
        // 验证成功回调函数
        validSuccess: (res, c, tac) => {
          // 销毁验证码服务
          tac.destroyWindow();
          // 调用登录方法
          if (res.success) {
            setCodeIsVisible(false);
            setLoginShow(true);
          }
        },
        // 验证失败回调函数
        validFail: (res, c, tac) => {
          tac.reloadCaptcha();
        },
        // 刷新按钮回调事件
        btnRefreshFun: (el, tac) => {
          tac.reloadCaptcha();
        },
        // 关闭按钮回调事件
        btnCloseFun: (el, tac) => {
          setCodeIsVisible(false);
        },
      };
      const style = {
        logoUrl,
      };
      // @ts-ignore
      new TAC(configData, style).init();
    }
  }, [codeIsVisible, setCodeIsVisible, setLoginShow, lwUrl, setChangePassword]);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordTwo, setNewPasswordTwo] = useState('');
  const [newStatus, setNewStatus] = useState();
  const [newStatusTwo, setNewStatusTwo] = useState();
  const [statusShow, setStatusShow] = useState(false);

  const onClickFrom = () => {
    if (newPassword !== newPasswordTwo) {
      // @ts-ignore
      setNewStatus('error');
      // @ts-ignore
      setNewStatusTwo('error');
      setStatusShow(true);
      return;
    } else {
      // @ts-ignore
      setNewStatus('success');
      // @ts-ignore
      setNewStatusTwo('success');
      setStatusShow(false);
      changePasswordFun();
      setChangePassword(false);
    }
  };

  const changePasswordFun = async () => {
    try {
      const response = await axios.post(
        `https://v8dev.lewanyun.com/api/users:update?filterByTk=${LWuserID}`,
        {
          password: newPasswordTwo,
          passwordLose: '200',
        },
        {
          headers: {
            'X-App': 'a_ygky',
            Authorization:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInJvbGVOYW1lIjoiYWRtaW4iLCJpYXQiOjE3MjM0NTE5MjQsImV4cCI6MzMyODEwNTE5MjR9.quDi9Np6cQUTgFM1dGJpwrXdnr7-iWLsCmr-_mxUqLo',
          },
        },
      );

      if (response.status === 200) {
        setNewPassword('');
        setNewPasswordTwo('');
        console.log('Password change successful:', response.data);
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  return (
    <div
      style={{
        maxWidth: 320,
        margin: '0 auto',
        paddingTop: '20vh',
      }}
    >
      <h1>{data?.data?.title}</h1>
      <AuthenticatorsContextProvider>
        <Outlet />
      </AuthenticatorsContextProvider>
      <div
        className={css`
          position: absolute;
          bottom: 24px;
          width: 100%;
          left: 0;
          text-align: center;
        `}
      >
        <PoweredBy />
      </div>
      {codeIsVisible && (
        <div className="codeBody">
          <div className="code">
            <div id="captcha-box"></div>
          </div>
        </div>
      )}
      {changePassword && (
        <div className="changePassword">
          <div className="changePassword-body">
            <div className="changePassword-title">密码过期修改密码</div>
            <div className="changePassword-form">
              <div className="changePassword-form-item">
                <div className="text">新密码:</div>
                {statusShow && <div className="statustext">与第二次密码输入不一致!!!</div>}
                <Input.Password
                  placeholder="输入新密码!"
                  value={newPassword}
                  status={newStatus}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                  }}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </div>
              <div className="changePassword-form-item">
                <div className="text">确认新密码:</div>
                {statusShow && <div className="statustext">与第一次密码输入不一致!!!</div>}
                <Input.Password
                  placeholder="确认新密码!"
                  value={newPasswordTwo}
                  status={newStatusTwo}
                  onBlur={(e) => {
                    if (newPassword !== e.target.value) {
                      // @ts-ignore
                      setNewStatusTwo('error');
                      // @ts-ignore
                      setNewStatus('error');
                      setStatusShow(true);
                    } else {
                      // @ts-ignore
                      setNewStatusTwo('success');
                      // @ts-ignore
                      setNewStatus('success');
                      setStatusShow(false);
                    }
                  }}
                  onChange={(e) => {
                    setNewPasswordTwo(e.target.value);
                  }}
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </div>
              <div className="changePassword-form-button">
                <Button type="primary" onClick={onClickFrom}>
                  确认
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

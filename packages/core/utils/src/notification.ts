import { notification } from 'antd';

export const showToast = (message, type = 'info', duration = 5000) => {
  notification[type]({
    message,
    duration,
  });
};

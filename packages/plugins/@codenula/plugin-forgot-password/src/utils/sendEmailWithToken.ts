export const sendEmailWithToken = async (api, email) => {
  //retrieving the token
  const sendEmail = await api.request({
    url: 'email:forgotPassword',
    method:'post',
    data: { email },
  })
};


import axios from 'axios';
import { Method } from 'axios';

export async function sendEmailRequest(params, token,obs) {
  const authorizationToken = `Bearer ${token}`;
  const config = {
    url: '/api/email:sendMyEmail',
    method: 'POST' as Method,
    headers: {
      Authorization: authorizationToken,
    },
    data: params,
  };

  try {
    const response = await axios(config);
    console.log(response);
    obs.apikey = token;
    obs.loading = false
    window.alert('email sent succesfully!');
  } catch (error) {
    console.log(error);
    window.alert('some error ocurred');
  }
}

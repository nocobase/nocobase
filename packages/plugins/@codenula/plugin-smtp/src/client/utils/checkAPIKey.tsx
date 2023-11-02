import { useAPIClient } from '@nocobase/client';
import axios from 'axios';

export const checkAPIKey = async (apikey) => {
  let isAPIKeyPresent;
  const url = '/api/apiKeys:list';
  const headers = {
    accept: 'application/json',
    Authorization:
      `Bearer ${apikey}`,
  };
  try {
    const response = await axios.get(url, { headers });

    isAPIKeyPresent = response?.data.data.length > 0 || false;
    console.log(isAPIKeyPresent);
    //   console.log(isAPIKeyPresent);
    return isAPIKeyPresent;
  } catch (err) {
    return false;
  }
};

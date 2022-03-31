import * as jwt from 'jsonwebtoken';

export function generateAccessToken({ userId, secret }) {
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
}

export async function decodeAccessToken({ token, secret }) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) {
        return reject(err);
      }

      resolve(decoded);
    });
  });
}

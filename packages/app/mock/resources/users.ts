import Mock from 'mockjs';

export async function check(req: any, res: any) {
  res.json({
    data: {
      username: `username - ${Mock.mock('@string')}`,
      token: Mock.mock('@string'),
    },
  });
}

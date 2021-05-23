import Mock from 'mockjs';

export async function list(req: any, res: any) {
  res.json({
    data: [],
    meta: {},
  });
}
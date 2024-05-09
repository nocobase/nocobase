import { mockAPIClient } from '../../../../testUtils';

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));
const { apiClient, mockRequest } = mockAPIClient();

mockRequest.onPost('/attachments:create').reply(async (config) => {
  const total = 1024; // mocked file size
  for (const progress of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    await sleep(500);
    if (config.onUploadProgress) {
      config.onUploadProgress({ loaded: total * progress, total });
    }
  }
  return [
    200,
    {
      data: {
        id: 2,
        title: 'd9f6ad6669902a9a8a1229d9f362235a (6)',
        filename: '7edb55e4e3145e5ac59ea3a44ca840e9.docx',
        extname: '.docx',
        path: '',
        size: null,
        url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/7edb55e4e3145e5ac59ea3a44ca840e9.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        meta: {},
        storage_id: 2,
        updated_at: '2022-01-21T07:21:21.084Z',
        created_at: '2022-01-21T07:21:21.084Z',
        created_by_id: null,
        updated_by_id: null,
      },
    },
  ];
});

export default apiClient;

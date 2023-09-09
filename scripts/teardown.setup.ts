import { FullConfig } from '@playwright/test';
import { deleteNocoBase } from './utils';

const shouldCloseServer = process.env.SHOULD_CLOSE_SERVER === 'true';

async function teardownSetup(config: FullConfig) {
  // 测试运行结束后，关闭服务
  if (shouldCloseServer) {
    deleteNocoBase();
  }
}

export default teardownSetup;

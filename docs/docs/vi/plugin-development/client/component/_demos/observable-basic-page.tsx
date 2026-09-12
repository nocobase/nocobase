import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/cn/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// Đoạn code dưới đây chỉ để demo này có thể chạy độc lập trong tài liệu, khi phát triển plugin thực tế không cần quan tâm đến việc khởi tạo app.
const app = new Application({
  // Trong code mẫu dùng memory router, trong dự án thực tế người dùng không cần quan tâm cái này, việc khởi tạo app được Nocobase xử lý nội bộ.
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();

/**
 * Contoh kode menunjukkan cara menggunakan plugin dan fitur model NocoBase.
 * - Mendefinisikan HelloModel sederhana untuk merender block UI "Hello, NocoBase!".
 * - Membuat plugin PluginHelloModel yang mendaftarkan model dan merendernya ke route.
 * - Terakhir, memuat plugin dan menjalankan aplikasi melalui instance Application.
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel adalah kelas plugin yang mendaftarkan HelloModel dan menambahkannya ke route.
 * - Metode load akan dieksekusi saat plugin dimuat.
 * - Mendaftarkan model ke flowEngine, dan membuat instance model.
 * - Merender instance model ke route pada path root '/'.
 */
class PluginHelloModel extends Plugin {
  async load() {
    // Mendaftarkan HelloModel ke flowEngine
    this.flowEngine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, modul akan dimuat hanya saat model ini benar-benar digunakan untuk pertama kalinya
        loader: () => import('@docs/cn/flow-engine/_demos/HelloModel'),
      },
     });

    // Membuat instance HelloModel (hanya untuk contoh)
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // Menambahkan route, merender model ke path root (hanya untuk contoh)
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// Membuat instance aplikasi, mendaftarkan plugin (hanya untuk contoh)
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
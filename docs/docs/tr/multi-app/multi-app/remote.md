---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/multi-app/multi-app/remote) bakın.
:::

# Çoklu Ortam Modu

## Giriş

Paylaşımlı bellek modundaki çoklu uygulamalar dağıtım ve operasyonlarda belirgin avantajlara sahiptir, ancak uygulama sayısı ve iş karmaşıklığı arttıkça, tek bir örnek giderek kaynak çekişmesi ve kararlılık düşüşü gibi sorunlarla karşılaşabilir. Bu tür senaryolar için kullanıcılar, daha karmaşık iş gereksinimlerini desteklemek amacıyla çoklu ortam hibrit dağıtım çözümünü benimseyebilirler.

Bu modda sistem, bir giriş uygulamasını merkezi yönetim ve zamanlama merkezi olarak dağıtırken, aynı zamanda fiili iş uygulamalarını barındırmak için bağımsız uygulama çalışma ortamları olarak birden fazla NocoBase örneği dağıtır. Ortamlar birbirinden izoledir ve birlikte çalışarak tek bir örneğin üzerindeki baskıyı etkili bir şekilde dağıtır; sistemin kararlılığını, ölçeklenebilirliğini ve hata izolasyon yeteneğini önemli ölçüde artırır.

Dağıtım düzeyinde, farklı ortamlar bağımsız süreçlerde çalışabilir, farklı Docker konteynerleri olarak dağıtılabilir veya birden fazla Kubernetes Deployment şeklinde var olabilir; bu da farklı ölçek ve mimarideki altyapı ortamlarına esnek bir şekilde uyum sağlamayı mümkün kılar.

## Dağıtım

Çoklu ortam hibrit dağıtım modunda:

- Giriş uygulaması (Supervisor), uygulama ve ortam bilgilerinin merkezi yönetiminden sorumludur.
- Çalışma uygulaması (Worker), fiili iş çalışma ortamı olarak görev yapar.
- Uygulama ve ortam yapılandırmaları Redis üzerinden önbelleğe alınır.
- Giriş uygulaması ile çalışma uygulaması arasındaki komut ve durum senkronizasyonu Redis iletişimine dayanır.

Şu anda ortam oluşturma işlevi henüz sunulmamıştır; her bir çalışma uygulamasının giriş uygulaması tarafından tanınabilmesi için manuel olarak dağıtılması ve ilgili ortam bilgilerinin yapılandırılması gerekir.

### Mimari Bağımlılıklar

Dağıtımdan önce lütfen aşağıdaki hizmetleri hazırlayın:

- Redis
  - Uygulama ve ortam yapılandırmalarını önbelleğe alır.
  - Giriş uygulaması ile çalışma uygulaması arasında komut iletişim kanalı olarak görev yapar.

- Veritabanı
  - Giriş uygulaması ve çalışma uygulamasının bağlanması gereken veritabanı hizmeti.

### Giriş Uygulaması (Supervisor)

Giriş uygulaması, uygulama oluşturma, başlatma, durdurma ve ortam zamanlamasının yanı sıra uygulama erişim proxy'sinden sorumlu merkezi yönetim merkezidir.

Giriş uygulaması ortam değişkenleri yapılandırma açıklaması:

```bash
# Uygulama modu
APP_MODE=supervisor
# Uygulama keşif yöntemi
APP_DISCOVERY_ADAPTER=remote
# Uygulama süreç yönetim yöntemi
APP_PROCESS_ADAPTER=remote
# Uygulama ve ortam yapılandırma önbelleği redis
APP_SUPERVISOR_REDIS_URL=
# Uygulama komut iletişim yöntemi
APP_COMMAND_ADPATER=redis
# Uygulama komut iletişim redis
APP_COMMAND_REDIS_URL=
```

### Çalışma Uygulaması (Worker)

Çalışma uygulaması, belirli NocoBase uygulama örneklerini barındıran ve çalıştıran fiili iş çalışma ortamıdır.

Çalışma uygulaması ortam değişkenleri yapılandırma açıklaması:

```bash
# Uygulama modu
APP_MODE=worker
# Uygulama keşif yöntemi
APP_DISCOVERY_ADAPTER=remote
# Uygulama süreç yönetim yöntemi
APP_PROCESS_ADAPTER=local
# Uygulama ve ortam yapılandırma önbelleği redis
APP_SUPERVISOR_REDIS_URL=
# Uygulama komut iletişim yöntemi
APP_COMMAND_ADPATER=redis
# Uygulama komut iletişim redis
APP_COMMAND_REDIS_URL=
# Ortam kimliği
ENVIRONMENT_NAME=
# Ortam erişim URL'si
ENVIRONMENT_URL=
# Ortam proxy erişim URL'si
ENVIRONMENT_PROXY_URL=
```

### Docker Compose Örneği

Aşağıdaki örnek, Docker konteynerlerini çalışma birimi olarak kullanan bir çoklu ortam hibrit dağıtım çözümünü göstermektedir; Docker Compose aracılığıyla bir giriş uygulaması ve iki çalışma uygulaması aynı anda dağıtılmaktadır.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Kullanım Kılavuzu

Uygulama temel yönetim işlemleri paylaşımlı bellek modu ile aynıdır, lütfen [paylaşımlı bellek moduna](./local.md) bakın. Bu bölüm esas olarak çoklu ortam yapılandırmasıyla ilgili içeriği tanıtmaktadır.

### Ortam Listesi

Dağıtım tamamlandıktan sonra, giriş uygulamasının "Uygulama Denetleyicisi" sayfasına gidin; "Ortamlar" sekmesinde kayıtlı çalışma ortamlarının listesini görüntüleyebilirsiniz. Bu liste ortam kimliği, çalışma uygulaması sürümü, erişim URL'si ve durum gibi bilgileri içerir. Çalışma uygulamaları, ortamın kullanılabilirliğini sağlamak için her 2 dakikada bir sinyal (heartbeat) gönderir.

![](https://static-docs.nocobase.com/202512291830371.png)

### Uygulama Oluşturma

Bir uygulama oluştururken, bu uygulamanın hangi çalışma uygulamalarına dağıtılacağını belirtmek için bir veya daha fazla çalışma ortamı seçebilirsiniz. Normal durumlarda tek bir ortam seçilmesi önerilir. Yalnızca çalışma uygulamasında [hizmet ayrıştırma](/cluster-mode/services-splitting) yapıldığında ve yük dengeleme veya yetenek izolasyonu sağlamak için aynı uygulamanın birden fazla çalışma ortamına dağıtılması gerektiğinde birden fazla ortam seçilmelidir.

![](https://static-docs.nocobase.com/202512291835086.png)

### Uygulama Listesi

Uygulama listesi sayfası, her uygulamanın mevcut çalışma ortamını ve durum bilgilerini görüntüler. Uygulama birden fazla ortamda dağıtılmışsa, birden fazla çalışma durumu görüntülenir. Normal şartlar altında, birden fazla ortamdaki aynı uygulama tutarlı bir durumu korur ve başlatma ile durdurma işlemlerinin merkezi olarak kontrol edilmesi gerekir.

![](https://static-docs.nocobase.com/202512291842216.png)

### Uygulama Başlatma

Uygulama başlatılırken veritabanına başlatma verileri yazılabileceğinden, çoklu ortamdaki yarış durumlarını önlemek için birden fazla ortama dağıtılan uygulamalar sırayla başlatılır.

![](https://static-docs.nocobase.com/202512291841727.png)

### Uygulama Erişim Proxy'si

Çalışma uygulamalarına, giriş uygulamasının `/apps/:appName/admin` alt yolu üzerinden proxy aracılığıyla erişilebilir.

![](https://static-docs.nocobase.com/202601082154230.png)

Uygulama birden fazla ortamda dağıtılmışsa, proxy erişimi için bir hedef ortam belirtilmesi gerekir.

![](https://static-docs.nocobase.com/202601082155146.png)

Varsayılan olarak, proxy erişim adresi çalışma uygulamasının erişim adresini kullanır (ilgili ortam değişkeni `ENVIRONMENT_URL`); bu adresin giriş uygulamasının bulunduğu ağ ortamından erişilebilir olduğundan emin olunmalıdır. Farklı bir proxy erişim adresi kullanılması gerekiyorsa, `ENVIRONMENT_PROXY_URL` ortam değişkeni ile geçersiz kılınabilir.
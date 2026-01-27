:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Üretim Ortamına Dağıtım

NocoBase'i bir üretim ortamına dağıtırken, farklı sistem ve ortamların yapılandırma yöntemlerindeki farklılıklar nedeniyle bağımlılıkları kurmak zahmetli olabilir. Eksiksiz bir işlevsel deneyim için, **Docker** kullanarak dağıtım yapmanızı öneririz. Sistem ortamınız Docker kullanamıyorsa, **create-nocobase-app** kullanarak da dağıtım yapabilirsiniz.

:::warning

Üretim ortamında doğrudan kaynak koddan dağıtım yapılması önerilmez. Kaynak kodun birçok bağımlılığı vardır, boyutu büyüktür ve tam derleme yüksek CPU ve bellek gereksinimlerine sahiptir. Eğer kaynak koddan dağıtım yapmanız kesinlikle gerekiyorsa, öncelikle özel bir Docker imajı oluşturmanız ve ardından dağıtım yapmanız önerilir.

:::

## Dağıtım Süreci

Üretim ortamı dağıtımı için mevcut kurulum ve yükseltme adımlarına başvurabilirsiniz.

### Yeni Kurulum

- [Docker Kurulumu](../installation/docker.mdx)
- [create-nocobase-app Kurulumu](../installation/create-nocobase-app.mdx)

### Uygulamayı Yükseltme

- [Docker Kurulumunu Yükseltme](../installation/docker.mdx)
- [create-nocobase-app Kurulumunu Yükseltme](../installation/create-nocobase-app.mdx)

### Üçüncü Taraf Eklentilerini Kurma ve Yükseltme

- [Eklentileri Kurma ve Yükseltme](../install-upgrade-plugins.mdx)

## Statik Kaynak Vekili

Bir üretim ortamında, statik kaynakları bir vekil sunucu ile yönetmeniz önerilir, örneğin:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Sık Kullanılan Operasyon Komutları

Kurulum yöntemine bağlı olarak, NocoBase sürecini yönetmek için aşağıdaki komutları kullanabilirsiniz:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
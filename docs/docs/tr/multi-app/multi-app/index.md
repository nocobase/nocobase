---
pkg: '@nocobase/plugin-app-supervisor'
---

# Çoklu Uygulama Yönetimi

## Genel bakış

NocoBase, AppSupervisor ile tek girişten birden çok izole uygulamayı yönetmeyi sağlar.


Başlangıçta tek uygulama yeterlidir; ölçek büyüdükçe bakım maliyeti ve izolasyon ihtiyacı artar.


Bu modda birden çok uygulama tek NocoBase örneğinde çalışır; DB bağımsız olabilir ama süreç ve bellek ortaktır.

![](https://static-docs.nocobase.com/202512231055907.png)


Daha büyük ölçekte Supervisor + çoklu Worker ortamlarından oluşan hibrit mimari tercih edilir.

![](https://static-docs.nocobase.com/202512231215186.png)

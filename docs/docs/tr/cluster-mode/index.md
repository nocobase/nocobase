:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Küme Modu

## Giriş

NocoBase, v1.6.0 sürümünden itibaren uygulamaları küme modunda çalıştırmayı destekler. Bir uygulama küme modunda çalıştığında, birden fazla örnek (instance) kullanarak ve çok çekirdekli (multi-core) moddan faydalanarak eşzamanlı erişim işleme performansını artırabilir.

## Sistem Mimarisi

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Uygulama Kümesi**: Birden fazla NocoBase uygulama örneğinden oluşan bir kümedir. Birden çok sunucuya dağıtılabilir veya tek bir sunucuda çok çekirdekli modda birden fazla işlem olarak çalıştırılabilir.
*   **Veritabanı**: Uygulamanın verilerini depolar. Tek düğümlü veya dağıtılmış bir veritabanı olabilir.
*   **Paylaşımlı Depolama**: Uygulama dosyalarını ve verilerini depolamak için kullanılır, birden fazla örneğin okuma/yazma erişimini destekler.
*   **Ara Katman Yazılımı (Middleware)**: Uygulama kümesi içindeki iletişimi ve koordinasyonu desteklemek için önbellek (cache), senkronizasyon sinyalleri, mesaj kuyruğu ve dağıtılmış kilitler gibi bileşenleri içerir.
*   **Yük Dengeleyici (Load Balancer)**: İstemci isteklerini uygulama kümesindeki farklı örneklere dağıtmaktan, ayrıca sağlık kontrolleri yapmaktan ve hata durumunda devretmekten (failover) sorumludur.

## Daha Fazla Bilgi

Bu belge, NocoBase küme modunun yalnızca temel kavramlarını ve bileşenlerini tanıtmaktadır. Özel dağıtım detayları ve daha fazla yapılandırma seçeneği için lütfen aşağıdaki belgelere bakın:

-   Dağıtım
    -   [Hazırlıklar](./preparations)
    -   [Kubernetes Dağıtımı](./kubernetes)
    -   [Operasyonlar](./operations)
-   Gelişmiş
    -   [Hizmet Bölme](./services-splitting)
-   [Geliştirme Referansı](./development)
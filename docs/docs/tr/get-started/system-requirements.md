:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/get-started/system-requirements) bakın.
:::

# Sistem Gereksinimleri

Bu belgede belirtilen sistem gereksinimleri **yalnızca NocoBase uygulama servisinin kendisi** için geçerlidir ve uygulama süreçlerinin ihtiyaç duyduğu hesaplama ve bellek kaynaklarını kapsar. Aşağıdakiler dahil ancak bunlarla sınırlı olmamak üzere, **bağımlı olunan üçüncü taraf servisleri kapsamaz**:

- API ağ geçitleri / ters proxy'ler
- Veritabanı servisleri (örneğin MySQL veya PostgreSQL)
- Önbellek servisleri (örneğin Redis)
- Mesaj kuyrukları, nesne depolama gibi ara katman yazılımları

Yalnızca işlev doğrulama veya deneysel senaryolar dışında, **yukarıdaki üçüncü taraf servislerin ayrı sunucularda veya konteynerlerde bağımsız olarak dağıtılması** veya doğrudan ilgili bulut servislerinin kullanılması **şiddetle tavsiye edilir**.

İlgili servislerin sistem yapılandırması ve kapasite planlaması, **gerçek veri miktarı, iş yükü ve eşzamanlılık ölçeğine** göre ayrı ayrı değerlendirilmeli ve optimize edilmelidir.

## Tek Düğümlü Dağıtım Modu

Tek düğümlü dağıtım modu, NocoBase uygulama servisinin yalnızca tek bir sunucu veya konteyner örneği üzerinde çalışması anlamına gelir.

### Minimum Donanım Gereksinimleri

| Kaynak | Gereksinim |
|---|---|
| CPU | 1 Çekirdek |
| Bellek | 2 GB |

**Uygulanabilir senaryolar**:

- Mikro işletmeler
- Kavram kanıtlama (POC)
- Geliştirme / test ortamları
- Neredeyse hiç eşzamanlı erişimin olmadığı senaryolar

:::info{title=İpucu}

- Bu yapılandırma yalnızca sistemin çalışabilirliğini garanti eder, performans deneyimini garanti etmez.
- Veri miktarı veya eşzamanlı istekler arttığında, sistem kaynakları hızla bir darboğaz haline gelebilir.
- **Kaynak kod geliştirme, eklenti geliştirme veya kaynak koddan derleyerek dağıtma** senaryoları için, bağımlılık kurulumu, derleme ve oluşturma süreçlerinin başarıyla tamamlanmasını sağlamak amacıyla **en az 4 GB boş bellek** ayrılması önerilir.

:::

### Önerilen Donanım Gereksinimleri

| Kaynak | Önerilen Yapılandırma |
|---|---|
| CPU | 2 Çekirdek |
| Bellek | ≥ 4 GB |

**Uygulanabilir senaryolar**:

Orta ve küçük ölçekli işletmeler ile üretim ortamındaki düşük eşzamanlı iş yükleri için uygundur.

:::info{title=İpucu}

- Bu yapılandırma ile sistem, rutin yönetim paneli işlemlerini ve hafif iş yüklerini karşılayabilir.
- İş karmaşıklığı, eşzamanlı erişim veya arka plan görevleri arttığında, donanım özelliklerini yükseltmeyi veya küme moduna geçmeyi düşünmelisiniz.

:::

## Küme Modu

Orta ve büyük ölçekli, eşzamanlılığın yüksek olduğu iş senaryoları için uygundur. Yatay genişleme yoluyla sistemin kullanılabilirliğini ve iş hacmini artırabilirsiniz (ayrıntılar için lütfen şu adrese bakın: [Küme Modu](/cluster-mode)).

### Düğüm Donanım Gereksinimleri

Küme modunda, her bir uygulama düğümünün (Pod / örnek) donanım yapılandırmasının tek düğümlü dağıtım modu ile tutarlı olması önerilir.

**Düğüm başına minimum yapılandırma:**

- CPU: 1 Çekirdek
- Bellek: 2 GB

**Düğüm başına önerilen yapılandırma:**

- CPU: 2 Çekirdek
- Bellek: 4 GB

### Düğüm Sayısı Planlaması

- Kümedeki düğüm sayısı ihtiyaca göre ölçeklendirilebilir (2–N).
- Gerçekte ihtiyaç duyulan düğüm sayısı şunlara bağlıdır:
  - Eşzamanlı trafik miktarı
  - İş mantığı karmaşıklığı
  - Arka plan görevleri ve asenkron işlem yükü
  - Harici bağımlı servislerin yanıt verme kapasitesi

Üretim ortamlarında şunlar önerilir:

- İzleme metriklerini (CPU, bellek, istek gecikmesi vb.) birleştirerek düğüm ölçeğini dinamik olarak ayarlayın.
- Trafik dalgalanmalarıyla başa çıkabilmek için belirli bir kaynak yedeği (redundancy) bırakın.
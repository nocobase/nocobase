:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

## Tarih Saat Alan Türleri

Tarih saat alan türleri aşağıdaki gibi kategorize edilebilir:

- **Tarih Saat (Saat Dilimli)**: Tarih ve saat değerleri, UTC'ye (Eşgüdümlü Evrensel Zaman) dönüştürülür ve gerektiğinde saat dilimi ayarlamaları yapılır.
- **Tarih Saat (Saat Dilimsiz)**: Saat dilimi bilgisi içermeyen tarih ve saat verilerini depolar.
- **Tarih (Saatsiz)**: Yalnızca tarih bilgisini depolar, saat bileşenini içermez.
- **Saat**: Yalnızca saat bilgisini depolar, tarih bileşenini içermez.
- **Unix Zaman Damgası**: Unix zaman damgası olarak saklanır ve genellikle 1 Ocak 1970'ten bu yana geçen saniye sayısını temsil eder.

Tarih ve saatle ilgili alan türlerine örnekler:

| **Alan Türü**             | **Örnek Değer**            | **Açıklama**                                       |
|---------------------------|----------------------------|----------------------------------------------------|
| Tarih Saat (Saat Dilimli) | 2024-08-24T07:30:00.000Z   | UTC'ye dönüştürülür ve saat dilimi ayarlamaları yapılabilir. |
| Tarih Saat (Saat Dilimsiz)| 2024-08-24 15:30:00        | Saat dilimi bilgisi içermeyen tarih ve saati kaydeder. |
| Tarih (Saatsiz)           | 2024-08-24                 | Yalnızca tarih bilgisini depolar, saat içermez.    |
| Saat                      | 15:30:00                   | Yalnızca saat bilgisini depolar, tarih içermez.    |
| Unix Zaman Damgası        | 1724437800                 | 1 Ocak 1970 00:00:00 UTC'den bu yana geçen saniye sayısını temsil eder. |

## Veri Kaynağı Karşılaştırmaları

NocoBase, MySQL ve PostgreSQL için karşılaştırma tablosu:

| **Alan Türü**             | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|---------------------------|----------------------------|----------------------------|----------------------------------------|
| Tarih Saat (Saat Dilimli) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Tarih Saat (Saat Dilimsiz)| Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Tarih (Saatsiz)           | Date                       | DATE                       | DATE                                   |
| Saat                      | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Unix Zaman Damgası        | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Saat (Saat Dilimli)       | -                          | -                          | TIME WITH TIME ZONE                    |

**Not:**
- MySQL'in TIMESTAMP veri türü, `1970-01-01 00:00:01 UTC` ile `2038-01-19 03:14:07 UTC` arasındaki bir aralığı kapsar. Bu aralığın dışındaki tarih ve saatler için, Unix zaman damgalarını depolamak üzere DATETIME veya BIGINT kullanmanız önerilir.

## Tarih Saat Depolama İşleme Akışı

### Saat Dilimli

Bu, `Tarih Saat (Saat Dilimli)` ve `Unix Zaman Damgası` alanlarını içerir.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Not:**
- Daha geniş bir tarih aralığını desteklemek amacıyla, NocoBase'in Tarih Saat (Saat Dilimli) alanları için MySQL veritabanında DATETIME türü kullanılır. Depolanan tarih değeri, sunucunun TZ ortam değişkenine göre dönüştürülmüş bir değerdir. TZ ortam değişkeni değişirse, depolanan Tarih Saat değeri de değişecektir.
- UTC ile yerel saat arasında bir saat dilimi farkı bulunduğundan, ham UTC değerini doğrudan göstermek kullanıcıların kafasını karıştırabilir.

### Saat Dilimsiz

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Eşgüdümlü Evrensel Zaman), dünya genelindeki zamanı koordine etmek ve birleştirmek için kullanılan küresel bir zaman standardıdır. Atom saatlerine dayalı yüksek hassasiyetli bir standart olup, Dünya'nın dönüşüyle senkronize halde tutulur.

UTC ile yerel saat arasındaki fark, ham UTC değerlerinin doğrudan gösterilmesi durumunda kullanıcıların yanlış anlamasına neden olabilir. Örneğin:

| **Saat Dilimi** | **Tarih Saat**                    |
|-----------------|-----------------------------------|
| UTC             | 2024-08-24T07:30:00.000Z          |
| UTC+8           | 2024-08-24 15:30:00               |
| UTC+5           | 2024-08-24 12:30:00               |
| UTC-5           | 2024-08-24 02:30:00               |
| UTC+0           | 2024-08-24 07:30:00               |
| UTC-6           | 2024-08-23 01:30:00               |

Yukarıdaki değerlerin hepsi aynı zamanı temsil eder, yalnızca saat dilimleri farklıdır.
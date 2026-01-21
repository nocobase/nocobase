:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Dil Listesi

NocoBase çoklu dil desteği (i18n) sunar. Aşağıda, şu anda yerleşik olarak bulunan dillerin listesini bulabilirsiniz.
Her dil yapılandırması, bir **Yerel Kod (Locale Code)** ve bir **Görünen Ad (Etiket)** içerir.

## Dil Kodu Standartları

* Dil kodları, **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** standart formatını takip eder:

  ```
  language[-script][-region][-variant]
  ```

  Yaygın biçimi `dil-bölge` şeklindedir, örneğin:

  * `en-US` → İngilizce (Amerika Birleşik Devletleri)
  * `fr-FR` → Fransızca (Fransa)
  * `zh-CN` → Basitleştirilmiş Çince

* **Büyük/küçük harf duyarlıdır**:

  * Dil kısmı küçük harfle yazılır (`en`, `fr`, `zh`)
  * Bölge kısmı büyük harfle yazılır (`US`, `FR`, `CN`)

* Aynı dilin birden fazla bölgesel sürümü olabilir, örneğin:

  * `fr-FR` (Fransızca Fransızcası), `fr-CA` (Kanada Fransızcası)

## Yerleşik Diller

| Yerel Kod | Görünen Ad                 |
| ----- | -------------------- |
| ar-EG | العربية              |
| az-AZ | Azərbaycan dili      |
| bg-BG | Български            |
| bn-BD | Bengali              |
| by-BY | Беларускі            |
| ca-ES | Сatalà/Espanya       |
| cs-CZ | Česky                |
| da-DK | Dansk                |
| de-DE | Deutsch              |
| el-GR | Ελληνικά             |
| en-GB | English(GB)          |
| en-US | English              |
| es-ES | Español              |
| et-EE | Estonian (Eesti)     |
| fa-IR | فارسی                |
| fi-FI | Suomi                |
| fr-BE | Français(BE)         |
| fr-CA | Français(CA)         |
| fr-FR | Français             |
| ga-IE | Gaeilge              |
| gl-ES | Galego               |
| he-IL | עברית                |
| hi-IN | हिन्दी               |
| hr-HR | Hrvatski jezik       |
| hu-HU | Magyar               |
| hy-AM | Հայերեն              |
| id-ID | Bahasa Indonesia     |
| is-IS | Íslenska             |
| it-IT | Italiano             |
| ja-JP | 日本語                  |
| ka-GE | ქართული              |
| kk-KZ | Қазақ тілі           |
| km-KH | ភាសាខ្មែរ            |
| kn-IN | ಕನ್ನಡ                |
| ko-KR | 한국어                  |
| ku-IQ | کوردی                |
| lt-LT | lietuvių             |
| lv-LV | Latviešu valoda      |
| mk-MK | македонски јазик     |
| ml-IN | മലയാളം               |
| mn-MN | Монгол хэл           |
| ms-MY | بهاس ملايو           |
| nb-NO | Norsk bokmål         |
| ne-NP | नेपाली               |
| nl-BE | Vlaams               |
| nl-NL | Nederlands           |
| pl-PL | Polski               |
| pt-BR | Português brasileiro |
| pt-PT | Português            |
| ro-RO | România              |
| ru-RU | Русский              |
| si-LK | සිංහල                |
| sk-SK | Slovenčina           |
| sl-SI | Slovenščina          |
| sr-RS | српски језик         |
| sv-SE | Svenska              |
| ta-IN | Tamil                |
| th-TH | ภาษาไทย              |
| tk-TK | Turkmen              |
| tr-TR | Türkçe               |
| uk-UA | Українська           |
| ur-PK | Oʻzbekcha            |
| vi-VN | Tiếng Việt           |
| zh-CN | 简体中文                 |
| zh-HK | 繁體中文（香港）             |
| zh-TW | 繁體中文（台湾）             |

## Kullanım Talimatları

* Dil yapılandırmaları genellikle şunlar için kullanılır:

  * **Arayüz Görüntüsü**: Dil değiştirme menüsünde `etiketi` göstermek için.
  * **Uluslararasılaştırma Dosyası Yükleme**: `Yerel Kod`'a göre ilgili çeviri JSON dosyalarını yüklemek için.

* Yeni bir dil eklerken şunları yapmanız gerekir:

  1. Yerel Kodu tanımlamak için BCP 47 standardını takip edin;
  2. `etiket` olarak net bir yerelleştirilmiş ad sağlayın;
  3. İlgili çeviri dosyalarını sağlayın.
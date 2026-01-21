:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Danh sách ngôn ngữ

NocoBase hỗ trợ đa ngôn ngữ (i18n). Dưới đây là danh sách các ngôn ngữ được tích hợp sẵn. Mỗi cấu hình ngôn ngữ bao gồm một **Mã ngôn ngữ (Locale Code)** và một **Tên hiển thị (Label)**.

## Tiêu chuẩn mã ngôn ngữ

* Mã ngôn ngữ tuân theo định dạng chuẩn **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)**:

  ```
  language[-script][-region][-variant]
  ```

  Các dạng phổ biến là `ngôn ngữ-khu vực`, ví dụ:

  * `en-US` → Tiếng Anh (Hoa Kỳ)
  * `fr-FR` → Tiếng Pháp (Pháp)
  * `zh-CN` → Tiếng Trung giản thể

* **Phân biệt chữ hoa/thường**:

  * Phần ngôn ngữ viết thường (`en`, `fr`, `zh`)
  * Phần khu vực viết hoa (`US`, `FR`, `CN`)

* Cùng một ngôn ngữ có thể có nhiều phiên bản theo khu vực, ví dụ:

  * `fr-FR` (Tiếng Pháp Pháp), `fr-CA` (Tiếng Pháp Canada)

## Các ngôn ngữ tích hợp sẵn

| Mã ngôn ngữ | Tên hiển thị                 |
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
| ms-MY | بهاส ملايو           |
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
| zh-CN | Tiếng Trung giản thể |
| zh-HK | Tiếng Trung phồn thể (Hồng Kông) |
| zh-TW | Tiếng Trung phồn thể (Đài Loan) |

## Hướng dẫn sử dụng

* Cấu hình ngôn ngữ thường được sử dụng cho:

  * **Hiển thị giao diện**: Hiển thị `label` trong menu chuyển đổi ngôn ngữ.
  * **Tải tệp quốc tế hóa**: Tải các tệp JSON dịch thuật tương ứng dựa trên `Mã ngôn ngữ`.

* Khi thêm ngôn ngữ mới, bạn cần:

  1. Tuân thủ tiêu chuẩn BCP 47 để định nghĩa Mã ngôn ngữ;
  2. Cung cấp một tên bản địa hóa rõ ràng làm `label`;
  3. Cung cấp các tệp dịch thuật tương ứng.
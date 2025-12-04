:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# รายการภาษา

NocoBase รองรับหลายภาษา (i18n) ครับ/ค่ะ โดยด้านล่างนี้คือรายการภาษาที่มาพร้อมกับระบบในปัจจุบัน
การตั้งค่าภาษาแต่ละรายการจะประกอบด้วย **รหัสภาษา (Locale Code)** และ **ชื่อที่แสดง (Label)** ครับ/ค่ะ

## มาตรฐานรหัสภาษา

* รหัสภาษาใช้รูปแบบมาตรฐาน **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** ครับ/ค่ะ:

  ```
  language[-script][-region][-variant]
  ```

  รูปแบบที่พบบ่อยคือ `ภาษา-ภูมิภาค` เช่น:

  * `en-US` → ภาษาอังกฤษ (สหรัฐอเมริกา)
  * `fr-FR` → ภาษาฝรั่งเศส (ฝรั่งเศส)
  * `zh-CN` → ภาษาจีนตัวย่อ

* **การคำนึงถึงตัวพิมพ์เล็ก-ใหญ่**:

  * ส่วนของภาษาใช้ตัวพิมพ์เล็ก (`en`, `fr`, `zh`)
  * ส่วนของภูมิภาคใช้ตัวพิมพ์ใหญ่ (`US`, `FR`, `CN`)

* ภาษาเดียวกันอาจมีหลายเวอร์ชันตามภูมิภาค เช่น:

  * `fr-FR` (ภาษาฝรั่งเศสของฝรั่งเศส), `fr-CA` (ภาษาฝรั่งเศสของแคนาดา)

## ภาษาที่มาพร้อมกับระบบ

| รหัสภาษา  | ชื่อที่แสดง                 |
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
| zh-CN | 简体中文                 |
| zh-HK | 繁體中文（香港）             |
| zh-TW | 繁體中文（台湾）             |

## คำแนะนำการใช้งาน

* การตั้งค่าภาษาโดยทั่วไปจะใช้สำหรับ:

  * **การแสดงผลบนอินเทอร์เฟซ**: เพื่อแสดง `label` ในเมนูสลับภาษา
  * **การโหลดไฟล์สำหรับ Internationalization**: เพื่อโหลดไฟล์ JSON การแปลที่เกี่ยวข้องตาม `รหัสภาษา`

* เมื่อต้องการเพิ่มภาษาใหม่ คุณจะต้อง:

  1. กำหนดรหัสภาษาตามมาตรฐาน BCP 47
  2. ระบุชื่อที่แปลเป็นภาษาท้องถิ่นที่ชัดเจนสำหรับ `label`
  3. จัดเตรียมไฟล์การแปลที่เกี่ยวข้อง
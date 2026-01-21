:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การบิลด์

## การกำหนดค่าการบิลด์แบบกำหนดเอง

หากคุณต้องการกำหนดค่าการบิลด์แบบกำหนดเอง คุณสามารถสร้างไฟล์ `build.config.ts` ในไดเรกทอรีรูทของปลั๊กอิน โดยมีเนื้อหาดังนี้ครับ:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite ใช้สำหรับบิลด์โค้ดฝั่ง `src/client` ครับ

    // หากต้องการแก้ไขการตั้งค่า Vite สามารถดูรายละเอียดเพิ่มเติมได้ที่: https://vitejs.dev/guide/ ครับ
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup ใช้สำหรับบิลด์โค้ดฝั่ง `src/server` ครับ

    // หากต้องการแก้ไขการตั้งค่า tsup สามารถดูรายละเอียดเพิ่มเติมได้ที่: https://tsup.egoist.dev/#using-custom-configuration ครับ
    return config
  },
  beforeBuild: (log) => {
    // ฟังก์ชัน Callback ที่จะทำงานก่อนเริ่มกระบวนการบิลด์ เพื่อให้คุณสามารถดำเนินการบางอย่างก่อนการบิลด์ได้ครับ
  },
  afterBuild: (log: PkgLog) => {
    // ฟังก์ชัน Callback ที่จะทำงานหลังจากกระบวนการบิลด์เสร็จสิ้น เพื่อให้คุณสามารถดำเนินการบางอย่างหลังการบิลด์ได้ครับ
  };
});
```
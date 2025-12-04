:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การจัดการ Dependency

ในการพัฒนาปลั๊กอินของ NocoBase นั้น Dependency จะแบ่งออกเป็น 2 ประเภทหลัก ๆ ครับ/ค่ะ ได้แก่ **Dependency เฉพาะปลั๊กอิน** และ **Dependency แบบ Global**

-   **Dependency แบบ Global**: เป็น Dependency ที่จัดหาให้โดย `@nocobase/server` และ `@nocobase/client` ซึ่งปลั๊กอินไม่จำเป็นต้องนำไป Bundle แยกต่างหากครับ/ค่ะ
-   **Dependency เฉพาะปลั๊กอิน**: เป็น Dependency ที่ปลั๊กอินนั้น ๆ มีโดยเฉพาะ (รวมถึง Dependency ฝั่ง Server) ซึ่งจะถูก Bundle รวมไปกับผลลัพธ์ของปลั๊กอินครับ/ค่ะ

## หลักการพัฒนา

เนื่องจาก Dependency เฉพาะปลั๊กอินจะถูก Bundle รวมไปกับผลลัพธ์ของปลั๊กอิน (รวมถึง Dependency ฝั่ง Server ที่จะถูก Bundle ไปยัง `dist/node_modules`) ดังนั้น ในระหว่างการพัฒนาปลั๊กอิน คุณสามารถประกาศ Dependency ทั้งหมดไว้ใน `devDependencies` แทนที่จะเป็น `dependencies` ครับ/ค่ะ วิธีนี้จะช่วยหลีกเลี่ยงความแตกต่างระหว่างสภาพแวดล้อมการพัฒนา (Development Environment) และสภาพแวดล้อมการใช้งานจริง (Production Environment) ได้ครับ/ค่ะ

เมื่อปลั๊กอินของคุณจำเป็นต้องติดตั้ง Dependency เหล่านี้ โปรดตรวจสอบให้แน่ใจว่า **หมายเลขเวอร์ชัน** ตรงกับ Dependency แบบ Global ที่อยู่ใน `@nocobase/server` และ `@nocobase/client` นะครับ/คะ มิฉะนั้นอาจทำให้เกิดข้อขัดแย้งขณะรันไทม์ (Runtime Conflicts) ได้ครับ/ค่ะ

## Dependency แบบ Global

Dependency เหล่านี้ NocoBase จัดเตรียมไว้ให้ครับ/ค่ะ โดยปลั๊กอินไม่จำเป็นต้อง Bundle เอง หากมีความจำเป็นต้องใช้งาน ควรใช้เวอร์ชันที่ตรงกับเวอร์ชันของ Framework นะครับ/คะ

``` js
// NocoBase Core
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// สำหรับ @nocobase/auth
'jsonwebtoken',

// สำหรับ @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// สำหรับ @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// สำหรับ @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// สำหรับ @nocobase/logger
'winston',
'winston-daily-rotate-file',

// ระบบนิเวศของ Koa (Koa Ecosystem)
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// ระบบนิเวศของ React (React Ecosystem)
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// เครื่องมือทั่วไป (Common Utilities)
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## ข้อแนะนำในการพัฒนา

1.  **รักษาความสอดคล้องของ Dependency**\
    หากคุณจำเป็นต้องใช้ Package ที่มีอยู่ใน Dependency แบบ Global อยู่แล้ว โปรดหลีกเลี่ยงการติดตั้งเวอร์ชันที่แตกต่างกัน และให้ใช้ Dependency แบบ Global นั้นได้เลยครับ/ค่ะ

2.  **ลดขนาด Bundle ให้ได้มากที่สุด**\
    สำหรับ UI Library ทั่วไป (เช่น `antd`), Utility Library (เช่น `lodash`), หรือ Database Driver (เช่น `pg`, `mysql2`) คุณควรพึ่งพาเวอร์ชันที่ NocoBase จัดเตรียมไว้ให้แบบ Global เพื่อหลีกเลี่ยงการ Bundle ซ้ำซ้อนครับ/ค่ะ

3.  **ความสอดคล้องระหว่างสภาพแวดล้อมการ Debug และ Production**\
    การใช้ `devDependencies` จะช่วยให้มั่นใจได้ถึงความสอดคล้องระหว่างการพัฒนาและผลลัพธ์สุดท้ายของปลั๊กอินครับ/ค่ะ ซึ่งจะช่วยหลีกเลี่ยงความแตกต่างของสภาพแวดล้อมที่อาจเกิดจากการตั้งค่า `dependencies` และ `peerDependencies` ที่ไม่เหมาะสมได้ครับ/ค่ะ
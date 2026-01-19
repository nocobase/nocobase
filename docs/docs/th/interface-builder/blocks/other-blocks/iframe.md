---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::

# บล็อก Iframe

## บทนำ

บล็อก Iframe ช่วยให้คุณสามารถฝังหน้าเว็บหรือเนื้อหาภายนอกลงในหน้าปัจจุบันได้ครับ/ค่ะ ผู้ใช้สามารถรวมแอปพลิเคชันภายนอกเข้ากับหน้าเว็บได้อย่างง่ายดาย โดยการกำหนดค่า URL หรือแทรกโค้ด HTML โดยตรง เมื่อใช้หน้า HTML ผู้ใช้สามารถปรับแต่งเนื้อหาได้อย่างยืดหยุ่น เพื่อตอบสนองความต้องการในการแสดงผลที่เฉพาะเจาะจง วิธีนี้เหมาะอย่างยิ่งสำหรับสถานการณ์ที่ต้องการการแสดงผลที่ปรับแต่งได้ เนื่องจากสามารถโหลดทรัพยากรภายนอกได้โดยไม่ต้องเปลี่ยนหน้า ซึ่งช่วยเพิ่มประสบการณ์ผู้ใช้และประสิทธิภาพการโต้ตอบของหน้าเว็บให้ดียิ่งขึ้นครับ/ค่ะ

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## ไวยากรณ์เทมเพลต

ในโหมด HTML เนื้อหาของบล็อกรองรับการใช้ไวยากรณ์ของ **[Liquid template engine](https://shopify.github.io/liquid/basics/introduction/)** ครับ/ค่ะ

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## การรองรับตัวแปร

### การรองรับตัวแปรใน HTML

- รองรับการเลือกตัวแปรจากตัวเลือกตัวแปรในบริบทของบล็อกปัจจุบันครับ/ค่ะ
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- รองรับการฉีดและใช้งานตัวแปรในแอปพลิเคชันผ่านการเขียนโค้ดครับ/ค่ะ

คุณยังสามารถฉีดตัวแปรที่กำหนดเองเข้าไปในแอปพลิเคชันผ่านโค้ด และนำไปใช้ใน HTML ได้ครับ/ค่ะ ตัวอย่างเช่น การสร้างแอปพลิเคชันปฏิทินแบบไดนามิกโดยใช้ Vue 3 และ Element Plus:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

ตัวอย่าง: คอมโพเนนต์ปฏิทินอย่างง่ายที่สร้างด้วย React และ Ant Design (antd) ซึ่งใช้ dayjs ในการจัดการวันที่ครับ/ค่ะ

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### การรองรับตัวแปรใน URL

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

สำหรับข้อมูลเพิ่มเติมเกี่ยวกับตัวแปร โปรดดูที่ [ตัวแปร](/interface-builder/variables) ครับ/ค่ะ
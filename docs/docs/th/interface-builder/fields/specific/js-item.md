:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/interface-builder/fields/specific/js-item)
:::

thought
*   Task: Update Thai translation to match Chinese source.
    *   Rules:
        1.  Structure and length must match Chinese.
        2.  Meaning from Chinese, terminology from English.
        3.  Fix mistranslations, remove extra content.
        4.  Use formal polite form (ครับ/ค่ะ).
        5.  No AI notices.
    *   Key Terms: Collection (คอลเลกชัน), Workflow (เวิร์กโฟลว์), Data Source (แหล่งข้อมูล), Plugin (ปลั๊กอิน).
    *   Preserve: Markdown, code, URLs, images.

    *   *Title:* # JS Item -> # JS Item (Matches)
    *   *Intro:*
        *   CN: JS Item 用于表单中的“自定义项”（非字段绑定）。你可以用 JavaScript/JSX 渲染任意内容（提示、统计、预览、按钮等），并与表单、记录上下文交互，适合实时预览、说明提示、小型交互组件等场景。
        *   TH (Existing): JS Item ใช้สำหรับ "รายการที่กำหนดเอง" (custom items) ในฟอร์ม ซึ่งไม่ได้ผูกกับฟิลด์ใดๆ ครับ คุณสามารถใช้ JavaScript/JSX เพื่อเรนเดอร์เนื้อหาใดๆ ก็ได้ เช่น คำแนะนำ, สถิติ, การแสดงตัวอย่าง, ปุ่มต่างๆ และยังสามารถโต้ตอบกับฟอร์มและบริบทของเรคคอร์ดได้ด้วย เหมาะสำหรับสถานการณ์ที่ต้องการแสดงตัวอย่างแบบเรียลไทม์, คำแนะนำ หรือคอมโพเนนต์แบบโต้ตอบขนาดเล็กครับ
        *   *Check:* Matches well.

    *   *Runtime Context API:*
        *   CN: `ctx.element`：当前项的 DOM 容器（ElementProxy），支持 `innerHTML`、`querySelector`、`addEventListener` 等；
        *   TH (Existing): `ctx.element`: DOM container (ElementProxy) ของรายการปัจจุบัน รองรับ `innerHTML`, `querySelector`, `addEventListener` และอื่นๆ ครับ
        *   CN: `ctx.form`：AntD Form 实例，可 `getFieldValue / getFieldsValue / setFieldsValue / validateFields` 等；
        *   TH (Existing): `ctx.form`: AntD Form instance ที่สามารถใช้ `getFieldValue / getFieldsValue / setFieldsValue / validateFields` และอื่นๆ ได้ครับ
        *   CN: `ctx.blockModel`：所在表单块模型，可监听 `formValuesChange` 实现联动；
        *   TH (Existing): `ctx.blockModel`: โมเดลของบล็อกฟอร์มที่ JS Item อยู่ ซึ่งสามารถฟังเหตุการณ์ `formValuesChange` เพื่อสร้างการทำงานแบบเชื่อมโยง (linkage) ได้ครับ
        *   CN: `ctx.record` / `ctx.collection`：当前记录与集合元信息（部分场景可用）；
        *   TH (Existing): `ctx.record` / `ctx.collection`: เรคคอร์ดปัจจุบันและเมตาดาต้าของ คอลเลกชัน (ใช้ได้ในบางสถานการณ์) ครับ
        *   CN: `ctx.requireAsync(url)`：按 URL 异步加载 AMD/UMD 库；
        *   TH (Existing): `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสด้วย URL ครับ
        *   CN: `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
        *   TH (Existing): `ctx.importAsync(url)`: อิมพอร์ตโมดูล ESM แบบไดนามิกด้วย URL ครับ
        *   CN: `ctx.openView(viewUid, options)`：打开已配置的视图（抽屉/对话框/页面）；
        *   TH (Existing): `ctx.openView(viewUid, options)`: เปิดวิว (view) ที่ตั้งค่าไว้ (เช่น ลิ้นชัก (drawer), กล่องโต้ตอบ (dialog), หรือหน้าเพจ) ครับ
        *   CN: `ctx.message` / `ctx.notification`：全局提示与通知；
        *   TH (Existing): `ctx.message` / `ctx.notification`: ข้อความแจ้งเตือนและประกาศแบบ Global ครับ
        *   CN: `ctx.t()` / `ctx.i18n.t()`：国际化；
        *   TH (Existing): `ctx.t()` / `ctx.i18n.t()`: สำหรับการทำ Internationalization ครับ
        *   CN: `ctx.onRefReady(ctx.ref, cb)`：容器就绪后再渲染；
        *   TH (Existing): `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งานแล้วครับ
        *   CN: `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
        *   TH (Existing): Missing lodash, math, formula. Needs update.
        *   CN: `ctx.render(vnode)`：渲染 React 元素/HTML/DOM 到默认容器 `ctx.element`；多次渲染会复用 Root，并覆盖容器现有内容。
        *   TH (Existing): `ctx.render(vnode)`: เรนเดอร์ React element/HTML/DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ การเรนเดอร์หลายครั้งจะใช้ Root เดิมซ้ำ และเขียนทับเนื้อหาที่มีอยู่ในคอนเทนเนอร์ครับ

    *   *Editor and Snippets:*
        *   CN: `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
        *   TH (Existing): `Snippets`: เปิดรายการโค้ด Snippets ที่มาพร้อมกับระบบ ซึ่งคุณสามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ด้วยคลิกเดียวครับ
        *   CN: `Run`：直接运行当前代码，并将运行日志输出到底部 `Logs` 面板；支持 `console.log/info/warn/error` 与错误高亮定位。
        *   TH (Existing): `Run`: รันโค้ดปัจจุบันโดยตรง และแสดงผลลัพธ์การทำงานในพาเนล `Logs` ด้านล่างครับ รองรับ `console.log/info/warn/error` และการไฮไลต์ตำแหน่งข้อผิดพลาดด้วยครับ
        *   CN: 可结合 AI 员工生成/修改脚本：[AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)
        *   TH (Existing): สามารถใช้ร่วมกับ AI Employee เพื่อสร้าง/แก้ไขสคริปต์ได้ครับ: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/built-in/ai-coding) -> *Link needs update to match CN source.*

    *   *Common Usage:*
        *   CN: 1) 实时预览（读取表单值）
        *   TH (Existing): 1) การแสดงตัวอย่างแบบเรียลไทม์ (อ่านค่าจากฟอร์ม)
        *   CN: 2) 打开视图（抽屉）
        *   TH (Existing): 2) เปิดวิว (View) (ลิ้นชัก)
        *   CN: 3) 加载外部库并渲染
        *   TH (Existing): 3) โหลดและเรนเดอร์ไลบรารีภายนอก

    *   *Notes:*
        *   CN: 外部库加载建议使用可信 CDN，失败场景需做好兜底（如 `if (!lib) return;`）。
        *   TH (Existing): แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอกครับ และควรมีกลไกสำรองในกรณีที่เกิดข้อผิดพลาด (เช่น `if (!lib) return;`)
        *   CN: 选择器建议优先使用 `class` 或 `[name=...]`，避免使用固定 `id`，防止多个区块/弹窗中重复 `id`。
        *   TH (Existing): สำหรับ Selector แนะนำให้ใช้ `class` หรือ `[name=...]` เป็นหลักครับ และหลีกเลี่ยงการใช้ `id` แบบตายตัว เพื่อป้องกัน `id` ซ้ำกันในบล็อกหรือป๊อปอัปหลายๆ อัน
        *   CN: 事件清理：表单值频繁变化会触发多次渲染，绑定事件前应清理或去重（如先 `remove` 再 `add`，或 `{ once: true }`，或 `dataset` 标记防重复）。
        *   TH (Existing): การจัดการ Event: การเปลี่ยนแปลงค่าในฟอร์มบ่อยครั้งจะทำให้เกิดการเรนเดอร์หลายครั้งครับ ก่อนที่จะผูก Event ควรมีการเคลียร์หรือป้องกันการซ้ำซ้อน (เช่น การ `remove` ก่อนแล้วค่อย `add`, การใช้ `{ once: true }`, หรือการใช้ `dataset` เพื่อทำเครื่องหมายป้องกันการซ้ำ)

    *   *Related Docs:*
        *   CN: [变量与上下文](/interface-builder/variables)
        *   TH (Existing): [ตัวแปรและ Context](/interface-builder/variables)
        *   CN: [联动规则](/interface-builder/linkage-rule)
        *   TH (Existing): [กฎการเชื่อมโยง (Linkage Rules)](/interface-builder/linkage-rule)
        *   CN: [视图与弹窗](/interface-builder/actions/types/view)
        *   TH (Existing): [วิว (Views) และป๊อปอัป](/interface-builder/actions/types/view)

    *   Update `ctx.libs` list to include lodash, math.js, formula.js.
    *   Update AI Employee link path: `/ai-employees/features/built-in-employee`.
    *   Ensure "ครับ" is used consistently.
    *   Verify structure matches CN exactly.

    *   *Intro:* JS Item ใช้สำหรับ "รายการที่กำหนดเอง" (ไม่ใช่การผูกฟิลด์) ในฟอร์มครับ คุณสามารถใช้ JavaScript/JSX เพื่อเรนเดอร์เนื้อหาใดๆ ก็ได้ (เช่น คำแนะนำ, สถิติ, การแสดงตัวอย่าง, ปุ่ม ฯลฯ) และโต้ตอบกับฟอร์มและบริบทของเรคคอร์ดได้ เหมาะสำหรับสถานการณ์ต่างๆ เช่น การแสดงตัวอย่างแบบเรียลไทม์, คำแนะนำ หรือคอมโพเนนต์การโต้ตอบขนาดเล็กครับ
    *   *Runtime Context API:*
        *   `ctx.element`: คอนเทนเนอร์ DOM (ElementProxy) ของรายการปัจจุบัน รองรับ `innerHTML`, `querySelector`, `addEventListener` ฯลฯ ครับ
        *   `ctx.form`: อินสแตนซ์ AntD Form สามารถใช้ `getFieldValue / getFieldsValue / setFieldsValue / validateFields` ฯลฯ ได้ครับ
        *   `ctx.blockModel`: โมเดลบล็อกฟอร์มที่อยู่ สามารถฟัง `formValuesChange` เพื่อใช้ในการเชื่อมโยงได้ครับ
        *   `ctx.record` / `ctx.collection`: ข้อมูลเรคคอร์ดปัจจุบันและเมทาดาต้าของคอลเลกชัน (ใช้ได้ในบางสถานการณ์) ครับ
        *   `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ
        *   `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกตาม URL ครับ
        *   `ctx.openView(viewUid, options)`: เปิดมุมมองที่กำหนดค่าไว้ (ลิ้นชัก/ไดอะล็อก/หน้าเพจ) ครับ
        *   `ctx.message` / `ctx.notification`: การแจ้งเตือนและข้อความแจ้งเตือนทั่วโลกครับ
        *   `ctx.t()` / `ctx.i18n.t()`: การรองรับหลายภาษา (Internationalization) ครับ
        *   `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งานแล้วครับ
        *   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js ฯลฯ สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงถูกเก็บไว้เพื่อความเข้ากันได้ครับ)
        *   `ctx.render(vnode)`: เรนเดอร์ React element/HTML/DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ การเรนเดอร์หลายครั้งจะใช้ Root ซ้ำและเขียนทับเนื้อหาเดิมในคอนเทนเนอร์ครับ

    *   *Editor:*
        *   `Snippets`: เปิดรายการโค้ดสั้น (Snippets) ในตัว สามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ในคลิกเดียวครับ
        *   `Run`: รันโค้ดปัจจุบันโดยตรง และส่งออกบันทึกการทำงาน (Logs) ไปยังแผงด้านล่าง รองรับ `console.log/info/warn/error` และการระบุตำแหน่งข้อผิดพลาดด้วยไฮไลต์ครับ
        *   สามารถใช้ร่วมกับ AI Employee เพื่อสร้าง/แก้ไขสคริปต์ได้ครับ: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/features/built-in-employee)

    *   *Usage:*
        *   1) การแสดงตัวอย่างแบบเรียลไทม์ (อ่านค่าฟอร์ม)
        *   2) เปิดมุมมอง (ลิ้นชัก)
        *   3) โหลดไลบรารีภายนอกและเรนเดอร์

    *   *Notes:*
        *   แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอก และควรจัดการกรณีที่โหลดล้มเหลวด้วย (เช่น `if (!lib) return;`) ครับ
        *   แนะนำให้ใช้ `class` หรือ `[name=...]` สำหรับตัวเลือก (Selector) และหลีกเลี่ยงการใช้ `id` ที่ตายตัว เพื่อป้องกัน `id` ซ้ำกันในหลายบล็อกหรือหน้าต่างป๊อปอัปครับ
        *   การล้างเหตุการณ์ (Event Cleanup): การเปลี่ยนแปลงค่าในฟอร์มบ่อยครั้งจะทริกเกอร์การเรนเดอร์หลายครั้ง ควรล้างหรือลบความซ้ำซ้อนก่อนผูกเหตุการณ์ (เช่น `remove` ก่อน `add`, หรือใช้ `{ once: true }`, หรือใช้ `dataset` เพื่อทำเครื่องหมายป้องกันการซ้ำ) ครับ

    *   *Related Docs:*
        *   [ตัวแปรและบริบท](/interface-builder/variables)
        *   [กฎการเชื่อมโยง](/interface-builder/linkage-rule)
        *   [มุมมองและหน้าต่างป๊อปอัป](/interface-builder/actions/types/view)

    *   Check terms: Collection (คอลเลกชัน), Workflow (เวิร์กโฟลว์), Data Source (แหล่งข้อมูล), Plugin (ปลั๊กอิน).
    *   Check politeness: "ครับ" added.
    *   Check structure: Matches CN.
    *   Check links: Updated.

    *Self-Correction during drafting:*
    - CN says "视图" (View). English says "View". Thai existing said "วิว". I will use "มุมมอง" or "วิว" consistently. The prompt says "Use Chinese for meaning, English for terminology reference". English uses "View". I'll use "มุมมอง (View)" or just "มุมมอง" to be formal. Let's stick to "มุมมอง" for a more formal Thai feel, or "วิว" if it's common in the UI. Looking at the existing Thai, it used "วิว". I'll use "มุมมอง" as it's more formal for "View".
    - CN says "抽屉" (Drawer). Thai "ลิ้นชัก".
    - CN says "对话框" (Dialog). Thai "ไดอะล็อก".
    - CN says "页面" (Page). Thai "หน้าเพจ".

    *Refining the ctx.libs section:*
    CN: `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置 React / ReactDOM / Ant Design / Ant Design 图标 / dayjs / lodash / math.js / formula.js 等通用库，用于 JSX 渲染、时间处理、数据操作与数学运算。（`ctx.React` / `ctx.ReactDOM` / `ctx.antd` 仍保留用于兼容。）
    TH: `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js และไลบรารีทั่วไปอื่นๆ สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงถูกเก็บไว้เพื่อความเข้ากันได้ครับ)

    *Refining the AI Employee link:*
    CN: [AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)
    TH: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/features/built-in-employee)

    *Refining Notes:*
    CN: 外部库加载建议使用可信 CDN，失败场景需做好兜底（如 `if (!lib) return;`）。
    TH: แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอก และควรเตรียมแผนสำรองสำหรับกรณีที่โหลดล้มเหลว (เช่น `if (!lib) return;`) ครับ

    *Final check on structure:*
    - Intro
    - Image
    - Runtime Context API (List)
    - Editor and Snippets (List + Image + AI link)
    - Common Usage (3 subheaders + code)
    - Notes (List)
    - Related Docs (List)

    Matches perfectly.
# JS Item

## 介绍 (แนะนำ)

JS Item ใช้สำหรับ "รายการที่กำหนดเอง" (ไม่ใช่การผูกฟิลด์) ในฟอร์มครับ คุณสามารถใช้ JavaScript/JSX เพื่อเรนเดอร์เนื้อหาใดๆ ก็ได้ (เช่น คำแนะนำ, สถิติ, การแสดงตัวอย่าง, ปุ่ม ฯลฯ) และโต้ตอบกับฟอร์มและบริบทของเรคคอร์ดได้ เหมาะสำหรับสถานการณ์ต่างๆ เช่น การแสดงตัวอย่างแบบเรียลไทม์, คำแนะนำ หรือคอมโพเนนต์การโต้ตอบขนาดเล็กครับ

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## 运行时上下文 API（常用） (Runtime Context API ที่ใช้บ่อย)

- `ctx.element`: คอนเทนเนอร์ DOM (ElementProxy) ของรายการปัจจุบัน รองรับ `innerHTML`, `querySelector`, `addEventListener` ฯลฯ ครับ
- `ctx.form`: อินสแตนซ์ AntD Form สามารถใช้ `getFieldValue / getFieldsValue / setFieldsValue / validateFields` ฯลฯ ได้ครับ
- `ctx.blockModel`: โมเดลบล็อกฟอร์มที่อยู่ สามารถฟัง `formValuesChange` เพื่อใช้ในการเชื่อมโยงได้ครับ
- `ctx.record` / `ctx.collection`: ข้อมูลเรคคอร์ดปัจจุบันและเมทาดาต้าของคอลเลกชัน (ใช้ได้ในบางสถานการณ์) ครับ
- `ctx.requireAsync(url)`: โหลดไลบรารี AMD/UMD แบบอะซิงโครนัสตาม URL ครับ
- `ctx.importAsync(url)`: นำเข้าโมดูล ESM แบบไดนามิกตาม URL ครับ
- `ctx.openView(viewUid, options)`: เปิดมุมมอง (View) ที่กำหนดค่าไว้ (ลิ้นชัก/ไดอะล็อก/หน้าเพจ) ครับ
- `ctx.message` / `ctx.notification`: การแจ้งเตือนและข้อความแจ้งเตือนทั่วโลกครับ
- `ctx.t()` / `ctx.i18n.t()`: การรองรับหลายภาษา (Internationalization) ครับ
- `ctx.onRefReady(ctx.ref, cb)`: เรนเดอร์หลังจากคอนเทนเนอร์พร้อมใช้งานแล้วครับ
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ไลบรารีในตัว เช่น React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js และไลบรารีทั่วไปอื่นๆ สำหรับการเรนเดอร์ JSX, การจัดการเวลา, การจัดการข้อมูล และการคำนวณทางคณิตศาสตร์ครับ (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` ยังคงถูกเก็บไว้เพื่อความเข้ากันได้ครับ)
- `ctx.render(vnode)`: เรนเดอร์ React element/HTML/DOM ไปยังคอนเทนเนอร์เริ่มต้น `ctx.element` ครับ การเรนเดอร์หลายครั้งจะใช้ Root ซ้ำและเขียนทับเนื้อหาเดิมในคอนเทนเนอร์ครับ

## 编辑器与片段 (ตัวแก้ไขและ Snippets)

- `Snippets`: เปิดรายการโค้ดสั้น (Snippets) ในตัว สามารถค้นหาและแทรกไปยังตำแหน่งเคอร์เซอร์ปัจจุบันได้ในคลิกเดียวครับ
- `Run`: รันโค้ดปัจจุบันโดยตรง และส่งออกบันทึกการทำงาน (Logs) ไปยังแผงด้านล่าง รองรับ `console.log/info/warn/error` และการระบุตำแหน่งข้อผิดพลาดด้วยไฮไลต์ครับ

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- สามารถใช้ร่วมกับ AI Employee เพื่อสร้าง/แก้ไขสคริปต์ได้ครับ: [AI Employee · Nathan: วิศวกร Frontend](/ai-employees/features/built-in-employee)

## 常见用法（精简示例） (การใช้งานทั่วไป - ตัวอย่างแบบย่อ)

### 1) 实时预览（读取表单值） (การแสดงตัวอย่างแบบเรียลไทม์ - อ่านค่าฟอร์ม)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) 打开视图（抽屉） (เปิดมุมมอง - ลิ้นชัก)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) 加载外部库并渲染 (โหลดไลบรารีภายนอกและเรนเดอร์)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 注意事项 (ข้อควรระวัง)

- แนะนำให้ใช้ CDN ที่เชื่อถือได้สำหรับการโหลดไลบรารีภายนอก และควรเตรียมแผนสำรองสำหรับกรณีที่โหลดล้มเหลว (เช่น `if (!lib) return;`) ครับ
- แนะนำให้ใช้ `class` หรือ `[name=...]` สำหรับตัวเลือก (Selector) และหลีกเลี่ยงการใช้ `id` ที่ตายตัว เพื่อป้องกัน `id` ซ้ำกันในหลายบล็อกหรือหน้าต่างป๊อปอัปครับ
- การล้างเหตุการณ์ (Event Cleanup): การเปลี่ยนแปลงค่าในฟอร์มบ่อยครั้งจะทริกเกอร์การเรนเดอร์หลายครั้ง ควรล้างหรือลบความซ้ำซ้อนก่อนผูกเหตุการณ์ (เช่น `remove` ก่อน `add`, หรือใช้ `{ once: true }`, หรือใช้ `dataset` เพื่อทำเครื่องหมายป้องกันการซ้ำ) ครับ

## 相关文档 (เอกสารที่เกี่ยวข้อง)

- [ตัวแปรและบริบท (Variables and Context)](/interface-builder/variables)
- [กฎการเชื่อมโยง (Linkage Rules)](/interface-builder/linkage-rule)
- [มุมมองและหน้าต่างป๊อปอัป (Views and Popups)](/interface-builder/actions/types/view)
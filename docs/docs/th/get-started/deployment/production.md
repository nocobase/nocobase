:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การติดตั้งใช้งานในสภาพแวดล้อม Production

เมื่อติดตั้งใช้งาน NocoBase ในสภาพแวดล้อม Production การติดตั้ง Dependencies อาจมีความซับซ้อน เนื่องจากวิธีการสร้างระบบและสภาพแวดล้อมที่แตกต่างกันไป เพื่อประสบการณ์การใช้งานที่สมบูรณ์แบบ เราขอแนะนำให้ติดตั้งใช้งานด้วย **Docker** หากสภาพแวดล้อมของระบบไม่สามารถใช้ Docker ได้ คุณสามารถติดตั้งใช้งานด้วย **create-nocobase-app** ได้เช่นกันครับ/ค่ะ

:::warning

ไม่แนะนำให้ติดตั้งใช้งานโดยตรงจาก Source Code ในสภาพแวดล้อม Production เนื่องจาก Source Code มี Dependencies จำนวนมาก มีขนาดใหญ่ และการคอมไพล์ทั้งหมดต้องใช้ CPU และ Memory สูง หากจำเป็นต้องติดตั้งใช้งานจาก Source Code จริงๆ แนะนำให้สร้าง Docker Image แบบ Custom ก่อน แล้วจึงนำไปติดตั้งใช้งานครับ/ค่ะ

:::

## ขั้นตอนการติดตั้งใช้งาน

สำหรับการติดตั้งใช้งานในสภาพแวดล้อม Production สามารถอ้างอิงขั้นตอนการติดตั้งและอัปเกรดที่มีอยู่ได้เลยครับ/ค่ะ

### การติดตั้งใหม่

- [การติดตั้ง Docker](../installation/docker.mdx)
- [การติดตั้ง create-nocobase-app](../installation/create-nocobase-app.mdx)

### การอัปเกรดแอปพลิเคชัน

- [การอัปเกรดการติดตั้ง Docker](../installation/docker.mdx)
- [การอัปเกรดการติดตั้ง create-nocobase-app](../installation/create-nocobase-app.mdx)

### การติดตั้งและอัปเกรดปลั๊กอินจากภายนอก

- [การติดตั้งและอัปเกรดปลั๊กอิน](../install-upgrade-plugins.mdx)

## Proxy สำหรับ Static Resource

ในสภาพแวดล้อม Production แนะนำให้จัดการ Static Resource ด้วย Proxy Server เช่น:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## คำสั่งสำหรับการดูแลระบบที่พบบ่อย

คุณสามารถใช้คำสั่งต่อไปนี้เพื่อจัดการ Process ของ NocoBase ได้ ขึ้นอยู่กับวิธีการติดตั้งครับ/ค่ะ

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
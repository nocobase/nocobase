---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/multi-app/multi-app/remote)
:::

# โหมดหลายสภาพแวดล้อม

## บทนำ

โหมดหลายแอปพลิเคชันแบบหน่วยความจำร่วม (Shared memory) มีข้อดีที่ชัดเจนในการปรับใช้และการดูแลรักษา แต่เมื่อจำนวนแอปพลิเคชันและความซับซ้อนของธุรกิจเพิ่มขึ้น อินสแตนซ์เดียวอาจเผชิญกับปัญหาการแย่งชิงทรัพยากรและความเสถียรที่ลดลง สำหรับสถานการณ์ประเภทนี้ ผู้ใช้สามารถเลือกใช้โซลูชันการปรับใช้แบบผสมผสานหลายสภาพแวดล้อมเพื่อรองรับความต้องการทางธุรกิจที่ซับซ้อนยิ่งขึ้นได้ครับ

ในโหมดนี้ ระบบจะปรับใช้แอปทางเข้า (Entry application) หนึ่งแอปเพื่อทำหน้าที่เป็นศูนย์กลางการจัดการและการจัดตารางเวลาแบบรวมศูนย์ ในขณะเดียวกันก็ปรับใช้ NocoBase หลายอินสแตนซ์เป็นสภาพแวดล้อมการรันแอปพลิเคชันที่เป็นอิสระ ซึ่งทำหน้าที่รองรับแอปพลิเคชันทางธุรกิจจริง แต่ละสภาพแวดล้อมจะแยกออกจากกันและทำงานร่วมกัน ซึ่งช่วยกระจายแรงกดดันของอินสแตนซ์เดียวได้อย่างมีประสิทธิภาพ และเพิ่มความเสถียร ความสามารถในการขยายระบบ และความสามารถในการแยกส่วนข้อผิดพลาดของระบบได้อย่างมากครับ

ในระดับการปรับใช้ สภาพแวดล้อมที่แตกต่างกันสามารถรันในโปรเซสที่เป็นอิสระ หรือปรับใช้เป็นคอนเทนเนอร์ Docker ที่แตกต่างกัน หรืออยู่ในรูปแบบของ Kubernetes Deployment หลายรายการ ซึ่งสามารถปรับให้เข้ากับสภาพแวดล้อมโครงสร้างพื้นฐานที่มีขนาดและสถาปัตยกรรมที่แตกต่างกันได้อย่างยืดหยุ่นครับ

## การปรับใช้

ภายใต้โหมดการปรับใช้แบบผสมผสานหลายสภาพแวดล้อม:

- แอปทางเข้า (Supervisor) รับหน้าที่จัดการข้อมูลแอปพลิเคชันและสภาพแวดล้อมแบบรวมศูนย์
- แอป Worker (Worker) ทำหน้าที่เป็นสภาพแวดล้อมการรันธุรกิจจริง
- การกำหนดค่าแอปพลิเคชันและสภาพแวดล้อมจะถูกแคชผ่าน Redis
- การซิงโครไนซ์คำสั่งและสถานะระหว่างแอปทางเข้าและแอป Worker ขึ้นอยู่กับการสื่อสารผ่าน Redis

ในปัจจุบันยังไม่มีฟังก์ชันการสร้างสภาพแวดล้อม แอป Worker แต่ละแอปจำเป็นต้องได้รับการปรับใช้ด้วยตนเองและกำหนดค่าข้อมูลสภาพแวดล้อมที่เกี่ยวข้องก่อนที่แอปทางเข้าจะสามารถระบุได้ครับ

### ส่วนพึ่งพาทางสถาปัตยกรรม

กรุณาเตรียมบริการต่อไปนี้ให้พร้อมก่อนการปรับใช้:

- Redis
  - แคชการกำหนดค่าแอปพลิเคชันและสภาพแวดล้อม
  - ทำหน้าที่เป็นช่องทางการสื่อสารคำสั่งระหว่างแอปทางเข้าและแอป Worker

- ฐานข้อมูล
  - บริการฐานข้อมูลที่แอปทางเข้าและแอป Worker จำเป็นต้องเชื่อมต่อ

### แอปทางเข้า (Supervisor)

แอปทางเข้าทำหน้าที่เป็นศูนย์กลางการจัดการแบบรวมศูนย์ รับผิดชอบในการสร้างแอป, การเริ่ม, การหยุด และการจัดตารางสภาพแวดล้อม รวมถึงพร็อกซีการเข้าถึงแอปพลิเคชันครับ

คำอธิบายการกำหนดค่าตัวแปรสภาพแวดล้อมของแอปทางเข้า

```bash
# โหมดแอปพลิเคชัน
APP_MODE=supervisor
# วิธีการค้นหาแอปพลิเคชัน
APP_DISCOVERY_ADAPTER=remote
# วิธีการจัดการโปรเซสแอปพลิเคชัน
APP_PROCESS_ADAPTER=remote
# Redis สำหรับแคชการกำหนดค่าแอปพลิเคชันและสภาพแวดล้อม
APP_SUPERVISOR_REDIS_URL=
# วิธีการสื่อสารคำสั่งแอปพลิเคชัน
APP_COMMAND_ADPATER=redis
# Redis สำหรับการสื่อสารคำสั่งแอปพลิเคชัน
APP_COMMAND_REDIS_URL=
```

### แอป Worker (Worker)

แอป Worker ทำหน้าที่เป็นสภาพแวดล้อมการรันธุรกิจจริง รับผิดชอบในการรองรับและรันอินสแตนซ์แอปพลิเคชัน NocoBase ที่เฉพาะเจาะจงครับ

คำอธิบายการกำหนดค่าตัวแปรสภาพแวดล้อมของแอป Worker

```bash
# โหมดแอปพลิเคชัน
APP_MODE=worker
# วิธีการค้นหาแอปพลิเคชัน
APP_DISCOVERY_ADAPTER=remote
# วิธีการจัดการโปรเซสแอปพลิเคชัน
APP_PROCESS_ADAPTER=local
# Redis สำหรับแคชการกำหนดค่าแอปพลิเคชันและสภาพแวดล้อม
APP_SUPERVISOR_REDIS_URL=
# วิธีการสื่อสารคำสั่งแอปพลิเคชัน
APP_COMMAND_ADPATER=redis
# Redis สำหรับการสื่อสารคำสั่งแอปพลิเคชัน
APP_COMMAND_REDIS_URL=
# รหัสสภาพแวดล้อม
ENVIRONMENT_NAME=
# URL การเข้าถึงสภาพแวดล้อม
ENVIRONMENT_URL=
# URL พร็อกซีการเข้าถึงสภาพแวดล้อม
ENVIRONMENT_PROXY_URL=
```

### ตัวอย่าง Docker Compose

ตัวอย่างต่อไปนี้แสดงโซลูชันการปรับใช้แบบผสมผสานหลายสภาพแวดล้อมโดยใช้คอนเทนเนอร์ Docker เป็นหน่วยการรัน โดยปรับใช้แอปทางเข้าหนึ่งแอปและแอป Worker สองแอปพร้อมกันผ่าน Docker Compose ครับ

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## คู่มือการใช้งาน

การจัดการพื้นฐานของแอปพลิเคชันไม่แตกต่างจากโหมดหน่วยความจำร่วม โปรดอ้างอิงจาก [โหมดหน่วยความจำร่วม](./local.md) ส่วนนี้จะแนะนำเนื้อหาที่เกี่ยวข้องกับการกำหนดค่าหลายสภาพแวดล้อมเป็นหลักครับ

### รายการสภาพแวดล้อม

หลังจากปรับใช้เสร็จสิ้น ให้เข้าสู่หน้า "App Supervisor" ของแอปทางเข้า คุณสามารถดูรายการสภาพแวดล้อมการทำงานที่ลงทะเบียนไว้ได้ในแท็บ "สภาพแวดล้อม" (Environments) ซึ่งรวมถึงข้อมูลต่างๆ เช่น รหัสสภาพแวดล้อม, เวอร์ชันของแอป Worker, URL การเข้าถึง และสถานะ แอป Worker จะรายงาน Heartbeat ทุกๆ 2 นาทีเพื่อให้แน่ใจว่าสภาพแวดล้อมพร้อมใช้งานครับ

![](https://static-docs.nocobase.com/202512291830371.png)

### การสร้างแอปพลิเคชัน

เมื่อสร้างแอปพลิเคชัน คุณสามารถเลือกสภาพแวดล้อมการรันได้ตั้งแต่หนึ่งสภาพแวดล้อมขึ้นไป เพื่อระบุว่าแอปพลิเคชันนี้จะถูกปรับใช้ในแอป Worker ใด โดยปกติแนะนำให้เลือกเพียงสภาพแวดล้อมเดียว เฉพาะในกรณีที่แอป Worker มีการทำ [การแยกบริการ (Service splitting)](/cluster-mode/services-splitting) และจำเป็นต้องปรับใช้แอปพลิเคชันเดียวกันในหลายสภาพแวดล้อมเพื่อกระจายโหลดหรือแยกความสามารถเท่านั้น จึงจะเลือกหลายสภาพแวดล้อมครับ

![](https://static-docs.nocobase.com/202512291835086.png)

### รายการแอปพลิเคชัน

หน้ารายการแอปพลิเคชันจะแสดงสภาพแวดล้อมการรันปัจจุบันและข้อมูลสถานะของแต่ละแอปพลิเคชัน หากแอปพลิเคชันถูกปรับใช้ในหลายสภาพแวดล้อม จะแสดงสถานะการรันหลายรายการ แอปพลิเคชันเดียวกันในหลายสภาพแวดล้อมจะรักษาสถานะให้ตรงกันภายใต้สภาวะปกติ และจำเป็นต้องควบคุมการเริ่มและหยุดพร้อมกันครับ

![](https://static-docs.nocobase.com/202512291842216.png)

### การเริ่มแอปพลิเคชัน

เนื่องจากการเริ่มแอปพลิเคชันอาจมีการเขียนข้อมูลเริ่มต้นลงในฐานข้อมูล เพื่อหลีกเลี่ยงสภาวะการแย่งชิง (Race condition) ในสภาพแวดล้อมที่หลากหลาย แอปพลิเคชันที่ปรับใช้ในหลายสภาพแวดล้อมจะเข้าคิวเพื่อเริ่มทำงานครับ

![](https://static-docs.nocobase.com/202512291841727.png)

### พร็อกซีการเข้าถึงแอปพลิเคชัน

แอป Worker สามารถเข้าถึงผ่านพร็อกซีได้โดยใช้เส้นทางย่อย `/apps/:appName/admin` ของแอปทางเข้าครับ

![](https://static-docs.nocobase.com/202601082154230.png)

หากแอปพลิเคชันถูกปรับใช้ในหลายสภาพแวดล้อม จำเป็นต้องระบุสภาพแวดล้อมเป้าหมายสำหรับการเข้าถึงผ่านพร็อกซีครับ

![](https://static-docs.nocobase.com/202601082155146.png)

โดยค่าเริ่มต้น ที่อยู่การเข้าถึงพร็อกซีจะใช้ที่อยู่การเข้าถึงของแอป Worker ซึ่งตรงกับตัวแปรสภาพแวดล้อม `ENVIRONMENT_URL` โดยต้องแน่ใจว่าที่อยู่นี้สามารถเข้าถึงได้ในสภาพแวดล้อมเครือข่ายที่แอปทางเข้าตั้งอยู่ หากต้องการใช้ที่อยู่การเข้าถึงพร็อกซีที่แตกต่างกัน สามารถเขียนทับได้ผ่านตัวแปรสภาพแวดล้อม `ENVIRONMENT_PROXY_URL` ครับ
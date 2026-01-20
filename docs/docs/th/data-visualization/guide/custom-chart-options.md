:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การกำหนดค่าแผนภูมิแบบกำหนดเอง

ในโหมดกำหนดเอง คุณสามารถตั้งค่าแผนภูมิได้โดยการเขียนโค้ด JS ใน Code Editor โดยอิงจาก `ctx.data` เพื่อส่งคืนค่า `option` ของ ECharts ที่สมบูรณ์ วิธีนี้เหมาะสำหรับการรวมหลายซีรีส์เข้าด้วยกัน การสร้างคำแนะนำที่ซับซ้อน และการปรับแต่งสไตล์แบบไดนามิก โดยหลักการแล้ว รองรับฟังก์ชัน ECharts และประเภทแผนภูมิทั้งหมดครับ/ค่ะ

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## บริบทของข้อมูล
- `ctx.data.objects`: อาร์เรย์ของออบเจกต์ (แต่ละแถวคือหนึ่งเรคคอร์ด)
- `ctx.data.rows`: อาร์เรย์สองมิติ (รวมส่วนหัวตาราง)
- `ctx.data.columns`: อาร์เรย์สองมิติที่จัดกลุ่มตามคอลัมน์

**การใช้งานที่แนะนำ:**
รวบรวมข้อมูลไว้ใน `dataset.source` สำหรับรายละเอียดการใช้งาน โปรดดูเอกสารประกอบของ ECharts ครับ/ค่ะ

 [ชุดข้อมูล](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [แกน](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [ตัวอย่าง](https://echarts.apache.org/examples/en/index.html)


มาดูตัวอย่างที่ง่ายที่สุดกันก่อนครับ/ค่ะ

## ตัวอย่างที่ 1: แผนภูมิแท่งแสดงจำนวนคำสั่งซื้อรายเดือน

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```


## ตัวอย่างที่ 2: แผนภูมิแนวโน้มยอดขาย

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**ข้อแนะนำ:**
- ใช้สไตล์ Pure Function โดยสร้าง `option` จาก `ctx.data` เท่านั้น และหลีกเลี่ยง Side Effect ครับ/ค่ะ
- การปรับเปลี่ยนชื่อคอลัมน์ในการ Query จะส่งผลต่อ Index ควรตั้งชื่อให้เป็นมาตรฐานและยืนยันในส่วน "ดูข้อมูล" ก่อนแก้ไขโค้ดครับ/ค่ะ
- สำหรับชุดข้อมูลขนาดใหญ่ ควรหลีกเลี่ยงการคำนวณแบบ Synchronous ที่ซับซ้อนใน JS หากจำเป็น ควรทำการรวมข้อมูล (Aggregate) ในขั้นตอนการ Query ครับ/ค่ะ


## ตัวอย่างเพิ่มเติม

สำหรับตัวอย่างการใช้งานเพิ่มเติม คุณสามารถดูได้จาก [แอปพลิเคชัน Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) ของ NocoBase ครับ/ค่ะ

คุณยังสามารถดู [ตัวอย่าง](https://echarts.apache.org/examples/en/index.html) อย่างเป็นทางการของ ECharts เพื่อเลือกเอฟเฟกต์แผนภูมิที่คุณต้องการ จากนั้นนำโค้ดการตั้งค่า JS ไปอ้างอิงและคัดลอกได้เลยครับ/ค่ะ
 

## ดูตัวอย่างและบันทึก

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- คลิก "ดูตัวอย่าง" ทางด้านขวา หรือที่ด้านล่าง เพื่อรีเฟรชแผนภูมิและตรวจสอบความถูกต้องของการตั้งค่า JS ครับ/ค่ะ
- คลิก "บันทึก" เพื่อบันทึกการตั้งค่า JS ปัจจุบันลงในฐานข้อมูลครับ/ค่ะ
- คลิก "ยกเลิก" เพื่อย้อนกลับไปยังสถานะที่บันทึกไว้ล่าสุดครับ/ค่ะ
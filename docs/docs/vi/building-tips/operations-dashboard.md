---
title: "Sử dụng NocoBase để xây dựng bảng điều khiển hoạt động có thể liên kết"
description: "Lấy bảng thông tin vận hành lệnh sản xuất làm ví dụ, khối biểu đồ, khối bộ lọc và khối JS được kết hợp để đạt được tính năng lọc, KPI, chi tiết biểu đồ và kiểu tùy chỉnh thống nhất."
keywords: "NocoBase, bảng thông tin vận hành, trực quan hóa dữ liệu, khối biểu đồ, khối bộ lọc, khối JS, chi tiết biểu đồ"
---

# Sử dụng NocoBase để xây dựng bảng điều khiển hoạt động có thể liên kết

Bài viết này lấy bảng điều khiển hoạt động của "hệ thống lệnh sản xuất" làm ví dụ để giới thiệu cách sử dụng kết hợp khối biểu đồ, khối bộ lọc và khối JS của NocoBase để xây dựng bảng điều khiển dữ liệu hỗ trợ liên kết bộ lọc, xem chi tiết biểu đồ và kiểu tùy chỉnh.

Mặc dù các ví dụ là từ các kịch bản lệnh sản xuất, nhưng các phương pháp này cũng có thể áp dụng cho các hệ thống kinh doanh như CRM, vận hành thiết bị, quản lý dự án, quy trình phê duyệt, thành công của khách hàng, v.v.

:::tip
Điều bài viết này muốn giới thiệu không phải là "cách sử dụng các khối JS để viết màn hình lớn", mà là cách kết hợp các khả năng khối gốc của NocoBase và các khối JS: Hãy để các khối gốc chịu trách nhiệm về các khả năng tiêu chuẩn và để các khối JS bổ sung cho trải nghiệm được cá nhân hóa.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## mục tiêu bối cảnh

Chúng tôi hy vọng xây dựng được bảng điều khiển Hoạt động để giúp nhóm vận hành hoặc dịch vụ nhanh chóng xác định khối lượng công việc hiện tại:

- Hiện tại có bao nhiêu lệnh làm việc đang mở?
- Lệnh sản xuất nào có nguy cơ SLA?
- Xu hướng trong đơn đặt hàng công việc mới là gì?
- Trạng thái và sự phân bổ ưu tiên của lệnh sản xuất là gì?
- Sau khi nhấp vào biểu đồ, bạn có thể xem chi tiết tương ứng

Trang này có thể được chia thành bốn lớp:

1. Vùng lọc hàng đầu: thời gian, nhóm dịch vụ, loại yêu cầu, mức độ ưu tiên, trạng thái SLA
2. Khu vực thống kê KPI: Tồn đọng mở, Chưa được chỉ định, cảnh báo SLA, v.v.
3. Khu vực phân tích biểu đồ: xu hướng, trạng thái, SLA, phân phối ưu tiên
4. Vùng chi tiết chi tiết: Nhấp vào biểu đồ để hiển thị các bản ghi khớp

## Đầu tiên, làm rõ ý tưởng xây dựng

Khi nhiều người tạo bảng thông tin dữ liệu, họ có xu hướng nghĩ vấn đề là một trong hai lựa chọn:

Hoặc sử dụng tất cả các khối gốc của NocoBase, cấu hình đơn giản nhưng lo lắng rằng kiểu dáng và tương tác không đủ linh hoạt; hoặc đơn giản là tự mình viết một khối JS lớn và tự mình kiểm soát truy vấn, biểu đồ, lọc và truy sâu, nhưng điều này sẽ làm mất đi sự tiện lợi do cấu hình low-code mang lại.

Trên thực tế, cách được khuyên dùng hơn là kết hợp cả hai.

Trong bảng điều khiển Hoạt động này, chúng tôi không viết toàn bộ trang dưới dạng màn hình JS lớn mà chia nó theo trách nhiệm:

- Bộ lọc hàng đầu sử dụng khối lọc đi kèm với hệ thống NocoBase;
- Biểu đồ xu hướng, phân phối trạng thái và phân phối SLA sử dụng các khối biểu đồ gốc;
- Thẻ KPI và chi tiết chi tiết sử dụng các khối JS;
- Các khối bộ lọc ảnh hưởng đến cả khối biểu đồ và khối JS;
- Sau khi nhấp vào biểu đồ, các điều kiện chi tiết sẽ được chuyển đến khối chi tiết JS bên dưới.

Ưu điểm của việc này là các thống kê và lọc tiêu chuẩn vẫn giữ được khả năng cấu hình của NocoBase, trong khi việc hiển thị được cá nhân hóa và các tương tác phức tạp được hoàn thành bởi các khối JS. Trang này không phải là "chỉ có thể định cấu hình" hay "tất cả mã", mà cấu hình và mã đều thực hiện nhiệm vụ riêng của chúng.

---

## 1. Cách tùy chỉnh kiểu khối biểu đồ

![](https://static-docs.nocobase.com/202607121920941.png)

Khối biểu đồ của NocoBase trước tiên có thể sử dụng Trình tạo truy vấn để xác định cỡ thống kê, sau đó sử dụng tùy chọn ECharts tùy chỉnh để điều chỉnh kiểu.

Lấy "thống kê trạng thái lệnh sản xuất" làm ví dụ, Trình tạo truy vấn có thể được định cấu hình là:

- Bảng dữ liệu: vé
- Số liệu: số id, bí danh ticketCount
- Kích thước: trạng thái

Điều quan trọng là khi tùy chỉnh kiểu, bạn không cần phải viết lại truy vấn, bạn chỉ cần xử lý hiển thị biểu đồ dựa trên `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Dòng mã này đọc kết quả truy vấn biểu đồ. Sau đó xác định nhãn trạng thái và màu sắc:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Chúng tôi khuyên bạn nên sử dụng tất cả các bản sao chép có thể nhìn thấy bằng `ctx.t()` để tạo điều kiện hỗ trợ đa ngôn ngữ tiếp theo.

Khi tạo dữ liệu biểu đồ, bạn có thể đính kèm thông tin chi tiết vào từng điểm dữ liệu biểu đồ:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

Điều quan trọng nhất ở đây là `ticketingDrilldown`. Đây không phải là trường tiêu chuẩn của ECharts mà là bối cảnh kinh doanh mà chúng tôi tự đặt vào, sẽ được sử dụng khi nhấp vào biểu đồ sau này.

Cuối cùng quay lại tùy chọn ECharts:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

Ý tưởng cốt lõi của phần này là:

- Người xây dựng truy vấn chịu trách nhiệm thống kê;
- Tùy chọn tùy chỉnh chịu trách nhiệm thể hiện trực quan;
- Các trường tùy chỉnh chịu trách nhiệm mang ngữ cảnh chi tiết.

---

## 2. Để khối lọc hệ thống trở thành phạm vi quan sát của toàn bộ trang

![](https://static-docs.nocobase.com/202607121920687.png)

Vùng lọc trong bảng thông tin vận hành không nên chỉ là một dạng riêng biệt. Nó đại diện cho đường kính quan sát hiện tại của toàn bộ trang.

Ví dụ: nếu người dùng chọn nhóm dịch vụ, loại yêu cầu và thời gian tạo thì KPI, biểu đồ xu hướng, phân bổ trạng thái và chi tiết chi tiết sẽ được hiển thị dựa trên cùng một bộ điều kiện. Nếu không, các số ở các khối khác nhau trên trang sẽ xung đột với nhau và người dùng sẽ khó đánh giá dữ liệu nào là kết quả trong phạm vi hiện tại.

Ở đây chúng tôi trực tiếp sử dụng khối lọc đi kèm với hệ thống NocoBase thay vì tự viết thành phần lọc. Các khối bộ lọc gốc có thể được liên kết một cách tự nhiên với các khối biểu đồ, cho phép khối biểu đồ tiếp tục sử dụng các cơ chế tạo truy vấn, quyền, làm mới và lọc.

`Dashboard scope` hàng đầu có thể định cấu hình các mục bộ lọc này:

- Created at
- Service group
- Request type
- Priority
- SLA status

Đối với các khối JS, bạn chỉ cần đọc cùng một bộ điều kiện lọc trong mã và sau đó chuyển đổi chúng thành các bộ lọc truy vấn. Bằng cách này, KPI và chi tiết chi tiết cũng có thể nhất quán với biểu đồ gốc.

Sự kết hợp của các điều kiện lọc có thể được gói gọn thành một hàm nhỏ:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Đếm theo bộ lọc:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Những điểm chính ở đây là:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

Khối JS truy vấn dữ liệu nghiệp vụ thông qua các tài nguyên thay vì viết SQL trực tiếp. Điều này giúp dễ dàng duy trì sự nhất quán với các quyền, nguồn dữ liệu và thời gian chạy trang của NocoBase.

---

## 3. Sử dụng các khối JS để hiển thị thẻ KPI

![](https://static-docs.nocobase.com/202607121920374.png)

KPI phù hợp hơn để sử dụng các khối JS. Bởi vì KPI thường không phải là một truy vấn đơn lẻ mà là sự kết hợp của nhiều cấp độ kinh doanh: chưa hoàn thành, chưa được chỉ định, cảnh báo SLA, vi phạm SLA, mới, đã giải quyết, v.v.

Khối JS có thể truy vấn lại dữ liệu dựa trên phạm vi lọc hiện tại và hiển thị dữ liệu đó vào thẻ thống kê.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Các điểm chính của khối JS là:

- Sử dụng `ctx.makeResource()` để truy vấn dữ liệu;
- Sử dụng `ctx.libs.antd` để hiển thị giao diện;
- Sử dụng `ctx.render()` để xuất nội dung;
- Kết xuất lại các đoạn JS sau khi lọc các thay đổi.

Trong một trang thực, nút bộ lọc và nút đặt lại có thể định cấu hình luồng sự kiện để chúng làm mới khối JS KPI và khối JS chi tiết cùng lúc sau khi hoàn thành hành động lọc gốc. Bằng cách này, người dùng nhấp một lần để lọc và cả biểu đồ cũng như nội dung tùy chỉnh sẽ được cập nhật dựa trên cùng một phạm vi.

---

## 4. Khối JS liên kết biểu đồ để xem chi tiết

![](https://static-docs.nocobase.com/202607121921577.png)

Nhấp vào biểu đồ để xem chi tiết là một tương tác rất thiết thực trong bảng điều khiển.

Trong kịch bản lệnh sản xuất, người dùng nhấp vào cột "Trạng thái: Mở" và tất cả các lệnh sản xuất đang mở sẽ được hiển thị trong khu vực chi tiết bên dưới; khi người dùng nhấp vào "vi phạm SLA", tất cả các lệnh làm thêm giờ sẽ được hiển thị bên dưới.

Ý tưởng thực hiện là:

1. Điểm dữ liệu biểu đồ mang `ticketingDrilldown`;
2. Sự kiện biểu đồ đọc thông tin chi tiết này;
3. Viết thông tin chi tiết vào ngữ cảnh khối JS đích;
4. Kích hoạt khối JS mục tiêu để kết xuất lại.

Mã khóa trong sự kiện biểu đồ như sau. Trước tiên hãy tìm khối JS chi tiết:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Sau đó viết các điều kiện chi tiết thu được bằng cách nhấp vào biểu đồ vào khối mục tiêu:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

Quan trọng nhất là hai dòng này:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

Dòng đầu tiên chuyển điều kiện chi tiết tới khối JS và dòng thứ hai kích hoạt làm mới khối JS.

Cuối cùng liên kết sự kiện nhấp vào biểu đồ:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

Ở đây bạn nên trả lại việc dọn dẹp:

```javascript
return () => chart.off('click', clickHandler);
```

Bằng cách này, khi biểu đồ được cấu hình lại hoặc hiển thị lại, các sự kiện cũ có thể được xóa sạch để tránh bị ràng buộc lặp lại.

Mã liên quan đến sự kiện nhấp chuột ở trên có thể áp dụng cho [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) trở lên. Tham khảo mã phiên bản cũ:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. Cách hiển thị chi tiết trong các khối JS chi tiết

![](https://static-docs.nocobase.com/202607121921601.png)

Đi sâu vào khối JS để đọc `ticketingDashboardDrilldown` vừa viết, sau đó truy vấn dữ liệu theo bộ lọc trong đó.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Nếu người dùng chưa nhấp vào biểu đồ, sẽ hiển thị lời nhắc. Sau khi click truy vấn thứ tự công việc dựa trên `drilldown.filter`:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Sau đó kết xuất bảng:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Nếu bạn cần xóa các điều kiện truy sâu, bạn có thể tham khảo

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Những điểm chính trong phần này là:

- Biểu đồ chỉ chịu trách nhiệm vượt qua bộ lọc;
- Khối JS chịu trách nhiệm truy vấn và hiển thị chi tiết;
- Nhấp vào các biểu đồ khác nhau để chia sẻ cùng một khối chi tiết.

---

## Những gợi ý thiết thực

### 1. Đừng vội viết mã toàn bộ trang phức tạp

Bài học quan trọng nhất từ ​​trang này là: đừng so sánh các khả năng gốc với các khả năng JS.

Nếu một khả năng đã là khả năng gốc của NocoBase, chẳng hạn như lọc, truy vấn biểu đồ, hiển thị bảng và kiểm soát quyền, thì khối gốc sẽ được sử dụng trước tiên. Bằng cách này, khi các trường, điều kiện bộ lọc và cỡ biểu đồ được điều chỉnh sau đó, chúng vẫn có thể được định cấu hình trên giao diện.

Các khối JS phù hợp hơn để xử lý các phần mà khối gốc không giỏi, chẳng hạn như kết hợp nhiều chỉ báo thành một bộ KPI, kiểu thẻ đặc biệt, hiển thị một bộ chi tiết tùy chỉnh sau khi nhấp vào biểu đồ hoặc chuyển ngữ cảnh kinh doanh giữa các khối khác nhau.

Nói cách khác, khối gốc chịu trách nhiệm về "khả năng tiêu chuẩn có thể định cấu hình" và khối JS chịu trách nhiệm về "trải nghiệm cá nhân hóa theo định hướng kinh doanh". Đây cũng là ý tưởng xây dựng có thể tái sử dụng nhiều nhất cho bảng thông tin này.

### 2. Để có số liệu thống kê đơn giản, trước tiên hãy sử dụng khối biểu đồ Trình tạo truy vấn.

Điều này duy trì khả năng truy vấn, quyền, lọc và làm mới tiêu chuẩn của NocoBase. Chỉ khi kiểu biểu đồ mặc định không thể thể hiện trọng tâm kinh doanh, hãy sử dụng tùy chọn ECharts tùy chỉnh để tối ưu hóa hình ảnh.

### 3. Thẻ KPI ưu tiên sử dụng khối JS

KPI thường yêu cầu nhiều truy vấn, kết hợp điều kiện và bố cục tùy chỉnh, đồng thời các khối JS linh hoạt hơn. Đặc biệt khi các KPI cần đáp ứng cùng một bộ điều kiện lọc của hệ thống, việc sử dụng các khối JS để xử lý chúng một cách thống nhất sẽ rõ ràng hơn.

### 4. Sự kiện biểu đồ sẽ trả về việc dọn dẹp

Phương pháp viết được đề xuất:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

Không trực tiếp sử dụng `chart.off('click')` để xóa tất cả các sự kiện nhấp chuột, vì điều này có thể vô tình xóa khối biểu đồ hoặc định cấu hình giám sát của chính bảng điều khiển.

---

## Hãy để AI giúp bạn xây dựng nó

Loại bảng thông tin này rất phù hợp với thế hệ được hỗ trợ bởi AI vì nó liên quan đến các mô hình dữ liệu, thước đo thống kê, kiểu biểu đồ và tương tác trang cùng một lúc. Bạn có thể đưa cho nó nội dung của bài viết này và đặt câu hỏi bằng cách sử dụng các từ gợi ý bên dưới.

Bạn có thể đặt những câu hỏi như thế này:

```markdown
Tôi đang sử dụng NocoBase để xây dựng bảng điều khiển hoạt động cho hệ thống lệnh sản xuất.
Vui lòng lấy kịch bản lệnh sản xuất làm ví dụ và giúp tôi thiết kế bảng thông tin Hoạt động.

Vé bảng dữ liệu chứa:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

Trang yêu cầu:

1. Bộ lọc hàng đầu: Được tạo tại, Nhóm dịch vụ, Loại yêu cầu, Mức độ ưu tiên, trạng thái SLA.
2. Thẻ KPI: Hồ sơ tồn đọng mở, Chưa được chỉ định, Cảnh báo SLA, Vi phạm SLA, Vé mới, Vé đã giải quyết.
3. Biểu đồ: Xu hướng yêu cầu đã tạo, Trạng thái yêu cầu, trạng thái SLA, Kết hợp ưu tiên.
4. Sau khi nhấp vào biểu đồ, khối JS bên dưới hiển thị bảng chi tiết về Vé phù hợp.
5. Kiểu dáng biểu đồ phải phù hợp với thị trường hoạt động, màu sắc rõ ràng, bố cục gọn nhẹ.
6. Sử dụng ctx.t() cho tất cả bản sao JS.
7. Sự kiện biểu đồ sử dụng Chart.on và trả về chức năng dọn dẹp.
8. Ưu tiên sử dụng các khối lọc và khối biểu đồ gốc của NocoBase. Chỉ sử dụng các khối JS cho KPI, chi tiết chi tiết, kiểu đặc biệt và tương tác giữa các khối. Không viết toàn bộ trang dưới dạng một khối JS lớn.

Vui lòng đưa ra ý tưởng cấu hình cho từng khối và đánh dấu mã JS chính.
```

Nếu bạn đã có một trang, bạn cũng có thể để AI giúp bạn tối ưu hóa trang đó:

```markdown
Đây là thiết kế bảng điều khiển NocoBase hiện tại của tôi:
Ở trên cùng là vùng lọc, ở giữa là 4 biểu đồ và bên dưới là khối JS chi tiết.
Vui lòng giúp tôi tối ưu hóa từ góc độ trải nghiệm của người vận hành:

1. KPI nên hiển thị những chỉ số nào?
2. Có cần liên kết giữa các hải đồ hay không;
3. Những cột nào sẽ được hiển thị chi tiết;
4. Nên tổ chức các sự kiện khối và biểu đồ JS như thế nào;
5. Mã nào sẽ được đặt trong tùy chọn tùy chỉnh biểu đồ và mã nào sẽ được đặt trong khối JS.
```

Bằng cách này, nội dung do AI tạo ra sẽ gần gũi hơn với hoạt động kinh doanh thực tế thay vì chỉ đưa ra những mã riêng biệt.

:::warning
Nếu bạn chọn để AI giúp bạn xây dựng nó, vui lòng sử dụng trình quản lý sao lưu để sao lưu dự án trước khi bắt đầu.
:::

## Tài liệu tham khảo

- [Cấu hình biểu đồ ](/data-visualization/guide/chart-options)
- [Giao diện người dùngRunJS](/runjs/)
- [Mẫu lọc ](/interface-builder/blocks/filter-blocks/form)
- [Xây dựng AI - Xây dựng giao diện ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)

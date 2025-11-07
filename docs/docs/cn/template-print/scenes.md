# 使用「模板打印」功能生成《供货与采购合同》示例

在供应链或贸易场景下，时常需要快速生成一份标准化的"供货与采购合同"，并根据数据源中的买家、卖家、商品明细等信息动态填充内容。下面将以一个简化的「合同」用例为例，向您展示如何配置并使用"模板打印"功能，将数据信息映射到合同模板中的占位符，从而自动生成最终合同文档。

---

## 1. 背景与数据结构概述

在我们的示例中，大致存在以下主要数据表（省略其他不相关字段）：

- **parties**：存储甲方/乙方的单位或个人信息，包括名称、地址、联系人、电话等
- **contracts**：存储具体的合同记录，包括合同编号、买方/卖方外键、签字人信息、起止日期、银行账户等
- **contract_line_items**：用于保存该合同下的多个条目（商品名称、规格、数量、单价、交货日期等）

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

由于当前系统仅支持单条打印，我们会在"合同详情"页点击"打印"，系统自动抓取对应的 contracts 记录，以及关联的 parties 等信息，填充到 Word 或 PDF 文档中。

---

## 2. 准备工作

### 2.1 插件准备

注意，我们的「模板打印」是商业插件，需购买激活之后才可进行打印操作。

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**确认插件激活：**

在任意页面中，创建一个详情区块（比如 users），查看操作配置中有没有对应模板配置的选项：

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 数据表创建

创建上方设计的主体表、合同表和商品条目表（挑选核心字段即可）。

#### 合同表（Contracts）

| 字段分类 | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Buyer ID | buyer_id | Integer |
| | Seller ID | seller_id | Integer |
| **Association Fields** | | | |
| | Contract Items | contract_items | One to many |
| | Buyer (Party A) | buyer | Many to one |
| | Seller (Party B) | seller | Many to one |
| **General Fields** | | | |
| | Contract Number | contract_no | Single line text |
| | Delivery Start Date | start_date | Datetime (with time zone) |
| | Delivery End Date | end_date | Datetime (with time zone) |
| | Deposit Ratio (%) | deposit_ratio | Percent |
| | Payment Days After Delivery | payment_days_after | Integer |
| | Bank Account Name (Beneficiary) | bank_account_name | Single line text |
| | Bank Name | bank_name | Single line text |
| | Bank Account Number (Beneficiary) | bank_account_number | Single line text |
| | Total Amount | total_amount | Number |
| | Currency Codes | currency_codes | Single select |
| | Balance Ratio (%) | balance_ratio | Percent |
| | Balance Days After Delivery | balance_days_after | Integer |
| | Delivery Place | delivery_place | Long text |
| | Party A Signatory Name | party_a_signatory_name | Single line text |
| | Party A Signatory Title | party_a_signatory_title | Single line text |
| | Party B Signatory Name | party_b_signatory_name | Single line text |
| | Party B Signatory Title | party_b_signatory_title | Single line text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### 主体表（Parties）

| 字段分类 | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| **General Fields** | | | |
| | Party Name | party_name | Single line text |
| | Address | address | Single line text |
| | Contact Person | contact_person | Single line text |
| | Contact Phone | contact_phone | Phone |
| | Position | position | Single line text |
| | Email | email | Email |
| | Website | website | URL |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

#### 商品条目表（Contract Line Items）

| 字段分类 | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Contract ID | contract_id | Integer |
| **Association Fields** | | | |
| | Contract | contract | Many to one |
| **General Fields** | | | |
| | Product Name | product_name | Single line text |
| | Specification / Model | spec | Single line text |
| | Quantity | quantity | Integer |
| | Unit Price | unit_price | Number |
| | Total Amount | total_amount | Number |
| | Delivery Date | delivery_date | Datetime (with time zone) |
| | Remark | remark | Long text |
| **System Fields** | | | |
| | Created At | createdAt | Created at |
| | Created By | createdBy | Created by |
| | Last Updated At | updatedAt | Last updated at |
| | Last Updated By | updatedBy | Last updated by |

### 2.3 界面配置

**录入示例数据：**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**联动规则配置如下，自动计算总价和后付款项：**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**创建查看区块，确认数据后，开启「模板打印」操作：**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 模板打印插件配置

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

新增一条模板配置，比如《供货与采购合同》：

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

接下来我们来到字段列表的 Tab 页，可以看到目前对象所有的字段。稍后我们点击"复制"之后，即可开始填充模板。

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 合同文件准备

**Word 合同模板文件**

事先准备好合同范本（.docx 文件），例如：`SUPPLY AND PURCHASE CONTRACT.docx`

在本文示例中，我们给出了一个简化版《供货与采购合同》，其中包含了示例占位符：

- `{d.contract_no}`：合同编号
- `{d.buyer.party_name}`、`{d.seller.party_name}`：买方、卖方名称
- `{d.total_amount}`：合同总金额
- 以及其他"联系人""地址""电话"等占位符

接下来可以根据你建表的字段进行复制并覆盖到 Word 中。

---

## 3. 模板变量教学

### 3.1 基本变量、关联对象属性填充

**基本字段填充：**

比如最上方的合同号，或者我们合同签署主体的对象。我们点击复制，直接粘贴到合同对应位置空白即可。

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 数据格式化

#### 日期格式化

在模板中，我们常常需要对字段进行格式化，特别是日期字段。直接复制的日期格式通常较长（如 Wed Jan 01 2025 00:00:00 GMT），需要通过格式化来展示我们想要的样式。

对于日期字段，可以使用 `formatD()` 函数来指定输出格式：

```
{字段名称:formatD(格式化样式)}
```

**示例：**

比如我们复制的原始字段是 `{d.created_at}`，而我们需要将日期格式化为 `2025-01-01` 这种格式，则改造这个字段变为：

```
{d.created_at:formatD(YYYY-MM-DD)}  // 输出：2025-01-01
```

**常见的日期格式化样式：**

- `YYYY` - 年份（四位数字）
- `MM` - 月份（两位）
- `DD` - 日期（两位）
- `HH` - 小时（24小时制）
- `mm` - 分钟
- `ss` - 秒

**例2：**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // 输出：2025-01-01 14:30:00
```

#### 金额格式化

假设有一个金额字段，比如合同中的 `{d.total_amount}`。我们可以使用 `formatN()` 函数来格式化数字，指定小数位数和千位分隔符。

**语法：**

```
{字段名称:formatN(小数位数, 千位分隔符)}
```

- **小数位数**：你可以指定保留多少位小数。例如，`2` 表示保留两位小数
- **千位分隔符**：指定是否使用千位分隔符，通常为 `true` 或 `false`

**示例 1：格式化金额为带千位分隔符的两位小数**

```
{d.amount:formatN(2, true)}  // 输出：1,234.56
```

这会将 `d.amount` 格式化为两位小数并添加千位分隔符。

**示例 2：格式化金额为不带小数位的整数**

```
{d.amount:formatN(0, true)}  // 输出：1,235
```

这会将 `d.amount` 格式化为整数，并添加千位分隔符。

**示例 3：格式化金额为没有千位分隔符的两位小数**

```
{d.amount:formatN(2, false)}  // 输出：1234.56
```

这里禁用了千位分隔符，只保留两位小数。

**其他金额格式化需求：**

- **货币符号**：Carbone 本身不直接提供货币符号的格式化功能，但你可以通过直接数据或模板中添加货币符号来实现。例如：
  ```
  {d.amount:formatN(2, true)} 元  // 输出：1,234.56 元
  ```

#### 字符串格式化

对于字符串字段，可以使用 `:upperCase` 来指定文本的格式，例如大小写转换。

**语法：**

```
{字段名称:upperCase:其他命令}
```

**常用转换方式：**

- `upperCase` - 转换为全大写
- `lowerCase` - 转换为全小写
- `upperCase:ucFirst` - 首字母大写

**示例：**

```
{d.party_a_signatory_name:upperCase}  // 输出：JOHN DOE
```

### 3.3 循环打印

#### 如何打印子对象列表（如商品明细）

当我们需要打印一个包含多个子项（例如商品明细）的表格时，通常需要采用循环打印的方式。这样，系统会根据列表中的每一项生成一行内容，直到遍历完所有项。

假设我们有一个商品列表（例如 `contract_items`），它包含多个商品对象。每个商品对象有多个属性，比如产品名称、规格、数量、单价、总金额和备注。

**步骤 1：在表格的第一行填写字段**

首先，在表格的第一行（不是表头）中，我们直接复制并填写模板变量。这些变量会被对应的数据替代，展示在输出中。

例如，表格的第一行如下所示：

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

这里，`d.contract_items[i]` 表示商品列表中的第 i 项，`i` 是一个索引，它代表当前商品的顺序。

**步骤 2：在第二行修改索引**

接下来，在第二行的表格中，我们将字段的索引修改为 `i+1`，并且填写第一个属性即可。这是因为在循环打印时，我们要从列表中取出下一项数据，并展示在下一行。

例如，第二行填写如下：
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |


在这个例子中，我们将 `[i]` 改为了 `[i+1]`，这样就能够获取列表中的下一项商品数据。

**步骤 3：模板渲染时自动循环打印**

当系统处理这个模板时，会按照以下逻辑操作：

1. 第一行会按照你在模板中设置的字段进行填充
2. 然后，系统会自动删除第二行，并开始从 `d.contract_items` 中提取数据，按表格中的格式循环填充每一行，直到所有商品明细打印完毕

每一行的 `i` 会递增，从而确保每一行显示的是不同的商品信息。

---

## 4. 上传并配置合同模板

### 4.1 上传模板

1. 点击「添加模板」按钮，输入模板名称，例如"供货与采购合同模板"
2. 上传准备好的 [Word 合同文件（.docx）](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx)，其中已包含所有占位符


![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. 完成后，系统会将该模板列在可选的模板列表中，供后续使用
4. 我们点击"使用"即可激活此模板

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

这个时候退出当前弹窗，点击下载模板，即可获取生成的完整模板。

**小贴士：**

- 若模板使用 `.doc` 或其他格式，可能需要转换为 `.docx`，具体视插件支持情况而定
- 在 Word 文件中，留意不要把占位符拆分到多个段落或文本框，以免出现渲染异常

---

祝使用顺利！通过「模板打印」功能，您可以在合同管理中极大节省重复工作、避免人工复制粘贴错误，实现合同的标准化与自动化输出。

:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Внешняя база данных

## Введение

Вы можете использовать уже существующие внешние базы данных в качестве **источника данных**. В настоящее время поддерживаются MySQL, MariaDB, PostgreSQL, MSSQL и Oracle.

## Инструкции по использованию

### Добавление внешней базы данных

После активации **плагина** вы сможете выбрать и добавить внешнюю базу данных из выпадающего меню «Add new» в разделе управления **источниками данных**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Заполните информацию о базе данных, к которой вы хотите подключиться.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Синхронизация коллекций

После установления соединения с внешней базой данных NocoBase автоматически прочитает все **коллекции** из **источника данных**. Внешние базы данных не поддерживают прямое добавление **коллекций** или изменение их структуры. Если вам нужно внести изменения, сделайте это через клиент базы данных, а затем нажмите кнопку «Обновить» в интерфейсе NocoBase для синхронизации.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Настройка полей

Внешняя база данных автоматически прочитает и отобразит поля существующих **коллекций**. Вы сможете быстро просмотреть и настроить заголовок поля, его тип данных (Field type) и тип пользовательского интерфейса (Field interface). Также вы можете нажать кнопку «Редактировать», чтобы изменить дополнительные параметры.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Поскольку внешние базы данных не поддерживают изменение структуры **коллекций**, при добавлении нового поля доступен только тип «связанное поле» (association field). Связанные поля не являются реальными полями в базе данных, они используются для установления связей между **коллекциями**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Более подробную информацию вы найдете в разделе [Поля **коллекции**/Обзор](/data-sources/data-modeling/collection-fields).

### Сопоставление типов полей

NocoBase автоматически сопоставляет типы полей из внешней базы данных с соответствующими типами данных (Field type) и типами пользовательского интерфейса (Field Interface).

- Тип данных (Field type): Определяет вид, формат и структуру данных, которые может хранить поле.
- Тип пользовательского интерфейса (Field interface): Относится к типу элемента управления, используемого в пользовательском интерфейсе для отображения и ввода значений поля.

| PostgreSQL | MySQL/MariaDB | Тип данных NocoBase | Тип интерфейса NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Неподдерживаемые типы полей

Неподдерживаемые типы полей отображаются отдельно. Эти поля можно будет использовать только после их адаптации разработчиками.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Ключ для фильтрации

**Коллекции**, отображаемые в виде блоков, должны иметь настроенный ключ для фильтрации (Filter target key). Ключ для фильтрации используется для отбора данных по определенному полю, при этом значение поля должно быть уникальным. По умолчанию ключом для фильтрации является поле первичного ключа **коллекции**. Если это представление, **коллекция** без первичного ключа или **коллекция** с составным первичным ключом, вам потребуется определить собственный ключ для фильтрации.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Только **коллекции** с настроенным ключом для фильтрации могут быть добавлены на страницу.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)
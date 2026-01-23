:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Зовнішня база даних

## Вступ

Використовуйте наявну зовнішню базу даних як джерело даних. Наразі підтримуються такі зовнішні бази даних: MySQL, MariaDB, PostgreSQL, MSSQL та Oracle.

## Інструкції з використання

### Додавання зовнішньої бази даних

Після активації плагіна ви зможете вибрати та додати її з випадаючого меню "Додати нове" (Add new) в управлінні джерелами даних.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Заповніть інформацію про базу даних, до якої потрібно підключитися.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Синхронізація колекцій

Після встановлення з'єднання із зовнішньою базою даних, вона безпосередньо зчитуватиме всі колекції з джерела даних. Зовнішні бази даних не підтримують пряме додавання колекцій або зміну структури таблиць. Якщо потрібні зміни, ви можете виконати їх через клієнт бази даних, а потім натиснути кнопку "Оновити" (Refresh) в інтерфейсі для синхронізації.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Налаштування полів

Зовнішня база даних автоматично зчитує поля наявних колекцій та відображає їх. Ви можете швидко переглянути та налаштувати заголовок поля, тип даних (Field type) та тип інтерфейсу (Field interface). Також можна натиснути кнопку "Редагувати" (Edit), щоб змінити додаткові налаштування.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Оскільки зовнішні бази даних не підтримують зміну структури таблиць, при додаванні нового поля доступний лише тип "поле зв'язку". Поля зв'язку не є реальними полями, а використовуються для встановлення зв'язків між колекціями.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Докладніше дивіться у розділі [Поля колекції/Огляд](/data-sources/data-modeling/collection-fields).

### Зіставлення типів полів

NocoBase автоматично зіставляє типи полів із зовнішньої бази даних з відповідними типами даних (Field type) та типами інтерфейсу (Field Interface).

- Тип даних (Field type): визначає вид, формат і структуру даних, які може зберігати поле.
- Тип інтерфейсу (Field interface): це тип елемента керування, який використовується в інтерфейсі користувача для відображення та введення значень поля.

| PostgreSQL | MySQL/MariaDB | Тип даних NocoBase | Тип інтерфейсу NocoBase |
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

### Непідтримувані типи полів

Непідтримувані типи полів відображаються окремо. Ці поля можна буде використовувати лише після їх адаптації розробниками.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Ключ цільового фільтра

Колекції, що відображаються як блоки, повинні мати налаштований ключ цільового фільтра (Filter target key). Ключ цільового фільтра використовується для фільтрації даних за певним полем, і значення поля має бути унікальним. За замовчуванням ключ цільового фільтра є полем первинного ключа колекції. Якщо це представлення, колекція без первинного ключа або колекція зі складеним первинним ключем, вам потрібно визначити власний ключ цільового фільтра.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Лише колекції, для яких налаштовано ключ цільового фільтра, можуть бути додані на сторінку.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)
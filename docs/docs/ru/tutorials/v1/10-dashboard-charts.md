# Глава 9: Панели задач и графики

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Дорогие друзья, наконец-то мы добрались до долгожданной главы про визуализацию! Здесь мы разберём, как в потоке информации быстро сосредоточиться на главном. Управленцу не пристало теряться в потоке задач — давайте легко и просто наведём порядок в статистике задач и информационных блоках.

### 9.1 Фокус на ключевой информации

Хочется одним взглядом охватывать состояние задач команды и видеть свои или важные для нас задачи, а не плутать в массе данных.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Сначала посмотрим, как создать [график](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) статистики по командным задачам.

#### 9.1.1 Создание [блока графика](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Создайте новую страницу (например, «Личная панель»):

1. Создайте блок графика. (В этом крупном блоке-контейнере можно создавать множество отдельных графиков.)
2. В блоке графика выберите цель — таблицу задач — и переходите к настройке.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Настройка статистики по статусу

Если хотим посчитать количество задач в разных статусах — что делать? Сначала подготовим данные:

- Метрика: выберите уникальное поле, например ID, для подсчёта.
- Размерность: используйте поле «Статус» для группировки.

Теперь настроим график:

1. Выберите [столбчатую диаграмму](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) или [горизонтальную столбчатую](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. По оси X — статус, по оси Y — ID. Не забудьте указать «Категориальное поле» — статус! (Иначе цвета не будут отличаться, что плохо для восприятия.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Многомерная статистика: количество задач у каждого

Если хотим посмотреть количество задач по каждому ответственному и статусу, добавим вторую размерность — «Ответственный/Псевдоним».

1. Нажмите «Выполнить запрос» в верхней части UI.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. График может выглядеть необычно — это не то, что Вам нужно. Не страшно: выберите режим «Группа» — и Вы увидите распределение по разным ответственным.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Если хочется одновременно видеть и общее количество, выбирайте «Стек». Тогда видно долю задач у каждого + общее количество задач!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Фильтрация данных и динамическое отображение

#### 9.2.1 Настройка фильтрации

Конечно, можно дополнительно убрать «Отменено» и «В архиве», просто сняв галочки в условиях слева. Уверены, эти операции уже Вам знакомы.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

После настройки нажмите «Подтвердить», выйдите из конфигурации — наш первый график готов.

#### 9.2.2 [Копирование графика](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

Хотите одновременно показывать и «Группу», и «Стек», но не настраивать второй график с нуля?

- В правом верхнем углу первого графика нажмите «Копировать».
- Прокрутите вниз — появился второй график. Перетащите его вправо, уберите «Стек», измените на «Группа».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 Динамическая [фильтрация](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)

Можно ли динамически [фильтровать](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) данные по разным условиям?

Конечно! В блоке графика откройте «Фильтрация» — сверху появится панель фильтров. Выведите нужные поля и настройте операторы. (Например, для поля даты выберите «Между».)

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Создание пользовательского поля фильтрации

А если иногда нужно учитывать «Отменено» и «В архиве», поддерживать динамическую фильтрацию и устанавливать значения фильтров по умолчанию?

Создадим [пользовательское поле фильтра](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)!

> Пользовательское поле фильтра: Вы можете выбрать поле из связанной таблицы или задать собственное (доступно только для графиков).
>
> Можно редактировать заголовок, описание, оператор фильтрации и задавать значение по умолчанию (например, текущий пользователь или дата) — фильтрация будет точнее соответствовать Вашим задачам.

1. Заголовок — «Статус».
2. Исходное поле оставьте пустым.
3. Компонент — «Чекбокс».
4. Варианты заполните по значениям статусов из БД (порядок: метка варианта — значение).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

После создания нажмите «Установить значение по умолчанию» и выберите нужные пункты.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

После настройки значения по умолчанию вернитесь в конфигурацию графика и измените условие фильтрации на «Статус — содержит любое из — Текущий фильтр/Статус», подтвердите изменения. (Сделайте это для обоих графиков!)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

Готово, протестируем фильтрацию — данные отобразились идеально.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Динамические ссылки и фильтрация задач

Реализуем очень полезную возможность: при клике по числу статистики переходить к задачам, отфильтрованным по этому статусу. Сначала добавим вверху страницы блоки со счётчиками для каждого статуса.

#### 9.3.1 На примере «Не начато» создадим [блок статистики](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Метрика: «Количество ID».
2. Условие фильтрации: Статус равен «Не начато».
3. Имя контейнера — «Не начато», тип — «Статистика», название графика оставьте пустым.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

Статистика «Не начато» отображается. Скопируйте блок ещё пять раз для остальных статусов и перетащите всё это вверх.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Настройка ссылки и фильтрации

1. Вернитесь на страницу с табличным блоком задач и посмотрите на адрес в браузере (обычно вида `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Здесь `xxxxxxxxx` — Ваш домен, а `/admin/0z9e0um1vcn` — путь. (Нам нужна часть после последнего `/admin`.)
2. Скопируйте часть ссылки

   - Нам нужно сделать переход по ссылке. Сначала возьмём специфическую её часть.
   - Начните с `admin/` (без самого `admin/`) до конца ссылки. В нашем примере это: `0z9e0um1vcn`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

При наведении на «Не начато» курсор превращается в руку — нажмите, переход выполнен.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Настройка ссылки графика
   Теперь добавим параметр фильтрации. Помните идентификатор статуса задачи в БД? Добавим этот параметр в конец ссылки, чтобы дополнительно фильтровать задачи.
   - В конец ссылки добавьте `?task_status=Not started` — получим: `0z9e0um1vcn?task_status=Not started`.
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Формат передачи параметров через URL:
> При добавлении параметров действуют простые правила:
>
> - **Знак вопроса (?)**: начало списка параметров.
> - **Имя и значение**: формат `имя=значение`.
> - **Несколько параметров**: соединяются через `&`, например:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Здесь `user` — другое имя параметра, `123` — его значение.

4. Возвращаемся на страницу, нажимаем — переход успешен, в URL добавились нужные параметры.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Использование URL-параметров для фильтрации](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Почему таблица не реагирует? Не волнуйтесь, осталось последнее действие!

- Вернитесь в настройку табличного блока и нажмите «Установить диапазон данных».
- Выберите «Статус» равен «URL-параметр запроса/status».

Подтвердите — фильтрация работает!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Визуализация данных](https://docs-cn.nocobase.com/handbook/data-visualization): эффектные графики

> Визуализация данных: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (коммерческий плагин).
> ECharts предлагает больше настраиваемых параметров, например «[линейные графики](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (многомерные)», «[лепестковые диаграммы](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)», «[облако слов](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)»...

Если Вам нужно больше типов графиков, активируйте блок «Визуализация данных: ECharts»!

#### 9.4.1 Быстрая настройка эффектной [лепестковой диаграммы](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Если данные перекрываются — отрегулируйте размер или радиус, чтобы вся информация была видна!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

После настройки перетащите блок и оформите внешний вид — готово!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Дополнительные виды графиков

Здесь Вас ждут и другие виды графиков для исследования.

##### [Облако слов](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Воронкообразная диаграмма](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Графики с несколькими метриками (двухосевой график, линейный график ECharts)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

В двухосевом графике можно добавлять больше метрик.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Сравнительная столбчатая диаграмма](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Маленький вызов

Перед окончанием главы — небольшое задание:

1. Добавьте URL-параметры для остальных статусов: **В работе, На проверке, Выполнено, Отменено, В архиве**, чтобы переходы по статистике корректно фильтровали задачи.
2. Настройте множественное поле «Ответственный» по аналогии с полем «Статус», задав значением по умолчанию псевдоним текущего пользователя.

В [следующей главе](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) мы продолжим работу над панелью задач, ждём встречи!

---

Продолжайте экспериментировать! Если возникнут вопросы — не забывайте о [официальной документации NocoBase](https://docs-cn.nocobase.com/) и [сообществе NocoBase](https://forum.nocobase.com/).

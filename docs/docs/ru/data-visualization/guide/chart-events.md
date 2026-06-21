# Пользовательские события взаимодействия

Пишите JS-код в редакторе событий и регистрируйте взаимодействия через экземпляр ECharts `chart`, чтобы включать связываение, например переход на новую страницу или открытие деталей.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Регистрация и отмена регистрации
- Регистрация: `chart.on(eventName, handler)`
- Отмена регистрации: `chart.off(eventName, handler)` или `chart.off(eventName)` для очистки событий по имени

**Примечание:**
Для безопасности настоятельно рекомендуется отменить регистрацию события перед повторной регистрацией.

## Структура параметров обработчика

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Часто используемые поля: `params.data` и `params.name`.

## Пример: клик для выделения выбора
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Выделить текущую точку данных
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Убрать выделение с остальных
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Пример: клик для перехода
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Вариант 1: внутренняя навигация без полной перезагрузки страницы (рекомендуется), нужен только относительный путь
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Вариант 2: переход на внешнюю страницу, требуется полный URL
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Вариант 3: открыть внешнюю страницу в новой вкладке, требуется полный URL
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Пример: клик для открытия деталей
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // зарегистрировать контекстные переменные для нового диалога
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

В только что открытом диалоге используйте контекстные переменные графика через `ctx.view.inputArgs.XXX`.

## Предпросмотр и сохранение
- Нажмите "Предпросмотр", чтобы загрузить и выполнить код события.
- Нажмите "Сохранить", чтобы сохранить текущую конфигурацию события.
- Нажмите "Отмена", чтобы вернуться к последнему сохраненному состоянию.

**Рекомендации:**
- Всегда используйте `chart.off('event')` перед привязкой, чтобы избежать повторных выполнений и роста потребления памяти.
- Используйте «легкие» операции внутри обработчиков событий (например, `dispatchAction`, `setOption`), чтобы не блокировать процесс отрисовки.
- Валидируйте связку Параметры графика и Запрос данных, чтобы поля, обрабатываемые в событии, соответствовали текущим данным.
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# BaseInterface

## Обзор

BaseInterface — это базовый класс для всех типов интерфейсов. Вы можете наследовать этот класс, чтобы реализовать собственную логику интерфейса.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Пользовательская логика toValue
  }

  toString(value: any, ctx?: any) {
    // Пользовательская логика toString
  }
}
// Регистрация интерфейса
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Преобразует внешнюю строку в фактическое значение интерфейса. Это значение можно напрямую передать в Repository для операций записи.

### toString(value: any, ctx?: any)

Преобразует фактическое значение интерфейса в строковый тип. Строковое значение можно использовать для экспорта или отображения.
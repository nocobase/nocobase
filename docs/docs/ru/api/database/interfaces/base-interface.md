# BaseInterface - Базовый интерфейс

## Обзор

BaseInterface — это базовый класс для всех типов интерфейсов. Пользователи могут наследовать этот класс для реализации собственной логики интерфейса.

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

### toValue(value: string, ctx?: Any): Promise<any>

Преобразует внешнюю строку в фактическое значение интерфейса. Значение может быть напрямую передано в репозиторий для операций записи.

### toString(значение: Any, ctx?: Any)

Преобразует фактическое значение интерфейса в строковый тип. Строковый тип можно использовать для экспорта или отображения.
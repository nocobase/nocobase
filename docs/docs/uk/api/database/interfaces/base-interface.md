:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# BaseInterface

## Огляд

BaseInterface є базовим класом для всіх типів інтерфейсів. Користувачі можуть успадковувати цей клас, щоб реалізувати власну логіку інтерфейсу.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Власна логіка toValue
  }

  toString(value: any, ctx?: any) {
    // Власна логіка toString
  }
}
// Реєстрація інтерфейсу
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Перетворює зовнішній рядок на фактичне значення інтерфейсу. Це значення можна безпосередньо передавати до Repository для операцій запису.

### toString(value: any, ctx?: any)

Перетворює фактичне значення інтерфейсу на рядковий тип. Рядковий тип можна використовувати для експорту або відображення.
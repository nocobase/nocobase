:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# BaseInterface

## Przegląd

`BaseInterface` to klasa bazowa dla wszystkich typów interfejsów. Mogą Państwo dziedziczyć po tej klasie, aby zaimplementować własną logikę interfejsu.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Własna logika toValue
  }

  toString(value: any, ctx?: any) {
    // Własna logika toString
  }
}
// Rejestracja interfejsu
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Konwertuje zewnętrzny ciąg znaków na rzeczywistą wartość interfejsu. Wartość tę można bezpośrednio przekazać do Repository w celu wykonania operacji zapisu.

### toString(value: any, ctx?: any)

Konwertuje rzeczywistą wartość interfejsu na typ `string`. Typ `string` może być używany do eksportu lub wyświetlania.
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# BaseInterface

## Přehled

`BaseInterface` je základní třída pro všechny typy rozhraní (Interface). Uživatelé mohou tuto třídu zdědit a implementovat si vlastní logiku rozhraní.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Vlastní logika toValue
  }

  toString(value: any, ctx?: any) {
    // Vlastní logika toString
  }
}
// Registrace rozhraní
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Převede externí řetězec na skutečnou hodnotu rozhraní. Tuto hodnotu lze přímo předat do Repository pro operace zápisu.

### toString(value: any, ctx?: any)

Převede skutečnou hodnotu rozhraní na typ řetězce (string). Typ řetězce lze použít pro export nebo zobrazení.
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# BaseInterface

## Überblick

`BaseInterface` ist die Basisklasse für alle Interface-Typen. Sie können diese Klasse erweitern, um Ihre eigene Interface-Logik zu implementieren.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Eigene toValue-Logik
  }

  toString(value: any, ctx?: any) {
    // Eigene toString-Logik
  }
}
// Interface registrieren
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Wandelt einen externen String in den tatsächlichen Wert des Interfaces um. Dieser Wert kann direkt an das Repository für Schreiboperationen übergeben werden.

### toString(value: any, ctx?: any)

Wandelt den tatsächlichen Wert des Interfaces in einen String-Typ um. Dieser String-Typ kann für den Export oder zur Anzeige verwendet werden.
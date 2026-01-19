:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# BaseInterface

## Översikt

BaseInterface är basklassen för alla Interface-typer. Ni kan ärva från denna klass för att implementera egen Interface-logik.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Egen toValue-logik
  }

  toString(value: any, ctx?: any) {
    // Egen toString-logik
  }
}
// Registrera interfacet
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Konverterar en extern sträng till interfacet faktiska värde. Värdet kan sedan skickas direkt till Repository för skrivoperationer.

### toString(value: any, ctx?: any)

Konverterar interfacet faktiska värde till en strängtyp. Strängtypen kan användas vid export eller för visning.
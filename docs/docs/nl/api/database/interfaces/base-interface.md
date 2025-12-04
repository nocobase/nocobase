:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# BaseInterface

## Overzicht

BaseInterface is de basisklasse voor alle Interface-typen. U kunt deze klasse overerven om uw eigen Interface-logica te implementeren.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Aangepaste toValue-logica
  }

  toString(value: any, ctx?: any) {
    // Aangepaste toString-logica
  }
}
// Registreer de Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Converteert een externe string naar de werkelijke waarde van de interface. Deze waarde kunt u direct doorgeven aan de Repository voor schrijfbewerkingen.

### toString(value: any, ctx?: any)

Converteert de werkelijke waarde van de interface naar een stringtype. Dit stringtype kunt u gebruiken voor export- of weergavedoeleinden.
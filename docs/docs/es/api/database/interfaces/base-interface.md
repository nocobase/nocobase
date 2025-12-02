:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# BaseInterface

## Visión general

BaseInterface es la clase base para todos los tipos de Interface. Usted puede heredar de esta clase para implementar su lógica de Interface personalizada.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Lógica personalizada de toValue
  }

  toString(value: any, ctx?: any) {
    // Lógica personalizada de toString
  }
}
// Registre la Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Convierte una cadena de texto externa en el valor real de la interface. Este valor se puede pasar directamente al Repository para operaciones de escritura.

### toString(value: any, ctx?: any)

Convierte el valor real de la interface a un tipo string. El tipo string se puede utilizar para exportar o mostrar datos.
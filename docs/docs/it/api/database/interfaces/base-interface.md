:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# BaseInterface

## Panoramica

BaseInterface è la classe base per tutti i tipi di Interface. Gli utenti possono estendere questa classe per implementare la propria logica di Interface personalizzata.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Logica toValue personalizzata
  }

  toString(value: any, ctx?: any) {
    // Logica toString personalizzata
  }
}
// Registra l'Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Converte una stringa esterna nel valore effettivo dell'interface. Il valore può essere passato direttamente al Repository per le operazioni di scrittura.

### toString(value: any, ctx?: any)

Converte il valore effettivo dell'interface in un tipo stringa. Il tipo stringa può essere utilizzato per l'esportazione o la visualizzazione.
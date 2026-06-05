:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# BaseInterface

## Visão Geral

BaseInterface é a classe base para todos os tipos de Interface. Você pode herdar esta classe para implementar sua própria lógica de Interface personalizada.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Lógica personalizada para toValue
  }

  toString(value: any, ctx?: any) {
    // Lógica personalizada para toString
  }
}
// Registra a Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Converte uma string externa para o valor real da interface. Este valor pode ser passado diretamente para o Repository para operações de escrita.

### toString(value: any, ctx?: any)

Converte o valor real da interface para o tipo string. O tipo string pode ser usado para exportação ou exibição.
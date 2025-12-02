:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# BaseInterface

## Aperçu

`BaseInterface` est la classe de base pour tous les types d'Interface. Vous pouvez hériter de cette classe pour implémenter votre propre logique d'Interface personnalisée.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Logique toValue personnalisée
  }

  toString(value: any, ctx?: any) {
    // Logique toString personnalisée
  }
}
// Enregistrer l'Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Convertit une chaîne de caractères externe en valeur réelle de l'interface. Cette valeur peut être directement transmise au Repository pour les opérations d'écriture.

### toString(value: any, ctx?: any)

Convertit la valeur réelle de l'interface en une chaîne de caractères. Ce type de chaîne peut être utilisé pour l'exportation ou l'affichage.
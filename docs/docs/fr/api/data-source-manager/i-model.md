# IModel

L'interface `IModel` définit les propriétés et méthodes de base d'un objet modèle.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Convertit l'objet modèle au format JSON.
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# IModel

Das `IModel`-Interface definiert die grundlegenden Eigenschaften und Methoden eines Modellobjekts.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Konvertiert das Modellobjekt in das JSON-Format.
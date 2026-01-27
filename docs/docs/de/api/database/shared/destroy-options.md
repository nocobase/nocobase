:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

**Typ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Gibt die Filterbedingungen für die zu löschenden Datensätze an. Eine detaillierte Beschreibung der Filter-Nutzung finden Sie in der [`find()`](#find)-Methode.
- `filterByTk`: Gibt die Filterbedingungen für die zu löschenden Datensätze anhand des TargetKey an.
- `truncate`: Gibt an, ob die Tabellendaten geleert werden sollen. Dies ist nur wirksam, wenn die Parameter `filter` oder `filterByTk` nicht übergeben werden.
- `transaction`: Das Transaktionsobjekt. Wird kein Transaktionsparameter übergeben, erstellt die Methode automatisch eine interne Transaktion.
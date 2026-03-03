:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/view).
:::

# ctx.view

Aktualnie aktywny kontroler widoku (okno dialogowe, szuflada, popover, obszar osadzony itp.), używany do uzyskiwania dostępu do informacji i operacji na poziomie widoku. Dostarczany przez `FlowViewContext`, jest dostępny wyłącznie w treści widoku otwartego za pomocą `ctx.viewer` lub `ctx.openView`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Treść okna dialogowego/szuflady** | Użyj `ctx.view.close()` wewnątrz `content`, aby zamknąć bieżący widok, lub użyj `Header` i `Footer` do renderowania nagłówków i stopek. |
| **Po przesłaniu formularza** | Wywołaj `ctx.view.close(result)` po pomyślnym przesłaniu, aby zamknąć widok i zwrócić wynik. |
| **JSBlock / Akcja** | Określ typ bieżącego widoku za pomocą `ctx.view.type` lub odczytaj parametry otwarcia z `ctx.view.inputArgs`. |
| **Wybór powiązań, podtabele** | Odczytaj `collectionName`, `filterByTk`, `parentId` itp. z `inputArgs` w celu załadowania danych. |

> Uwaga: `ctx.view` jest dostępny tylko w środowiskach RunJS z kontekstem widoku (np. wewnątrz `content` w `ctx.viewer.dialog()`, w formularzach okien dialogowych lub wewnątrz selektorów powiązań). Na standardowych stronach lub w kontekstach backendowych ma wartość `undefined`. Zaleca się stosowanie opcjonalnego łańcuchowania (`ctx.view?.close?.()`).

## Definicja typu

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Dostępne w widokach konfiguracji przepływu pracy
};
```

## Typowe właściwości i metody

| Właściwość/Metoda | Typ | Opis |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Typ bieżącego widoku |
| `inputArgs` | `Record<string, any>` | Parametry przekazane podczas otwierania widoku (patrz poniżej) |
| `Header` | `React.FC \| null` | Komponent nagłówka, używany do renderowania tytułów i obszarów akcji |
| `Footer` | `React.FC \| null` | Komponent stopki, używany do renderowania przycisków itp. |
| `close(result?, force?)` | `void` | Zamyka bieżący widok; `result` może zostać przekazany z powrotem do wywołującego |
| `update(newConfig)` | `void` | Aktualizuje konfigurację widoku (np. szerokość, tytuł) |
| `navigation` | `ViewNavigation \| undefined` | Nawigacja wewnątrz strony, w tym przełączanie kart (Tab) itp. |

> Obecnie tylko `dialog` i `drawer` obsługują `Header` i `Footer`.

## Typowe pola inputArgs

Pola w `inputArgs` różnią się w zależności od scenariusza otwarcia. Typowe pola obejmują:

| Pole | Opis |
|------|------|
| `viewUid` | UID widoku |
| `collectionName` | Nazwa kolekcji |
| `filterByTk` | Filtr klucza głównego (dla szczegółów pojedynczego rekordu) |
| `parentId` | ID nadrzędne (dla scenariuszy powiązań) |
| `sourceId` | ID rekordu źródłowego |
| `parentItem` | Dane elementu nadrzędnego |
| `scene` | Scena (np. `create`, `edit`, `select`) |
| `onChange` | Wywołanie zwrotne (callback) po wyborze lub zmianie |
| `tabUid` | UID bieżącej karty (wewnątrz strony) |

Dostęp do nich można uzyskać poprzez `ctx.getVar('ctx.view.inputArgs.xxx')` lub `ctx.view.inputArgs.xxx`.

## Przykłady

### Zamykanie bieżącego widoku

```ts
// Zamknij okno dialogowe po pomyślnym przesłaniu
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Zamknij i zwróć wyniki
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Używanie Header / Footer w treści

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Edytuj" extra={<Button size="small">Pomoc</Button>} />
      <div>Treść formularza...</div>
      <Footer>
        <Button onClick={() => close()}>Anuluj</Button>
        <Button type="primary" onClick={handleSubmit}>Zatwierdź</Button>
      </Footer>
    </div>
  );
}
```

### Rozgałęzianie logiki na podstawie typu widoku lub inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Ukryj nagłówek w widokach osadzonych
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scenariusz selektora użytkowników
}
```

## Relacja z ctx.viewer i ctx.openView

| Zastosowanie | Zalecane użycie |
|------|----------|
| **Otwieranie nowego widoku** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` lub `ctx.openView()` |
| **Operowanie na bieżącym widoku** | `ctx.view.close()`, `ctx.view.update()` |
| **Pobieranie parametrów otwarcia** | `ctx.view.inputArgs` |

`ctx.viewer` odpowiada za „otwieranie” widoku, podczas gdy `ctx.view` reprezentuje „bieżącą” instancję widoku; `ctx.openView` służy do otwierania wstępnie skonfigurowanych widoków przepływu pracy.

## Uwagi

- `ctx.view` jest dostępny tylko wewnątrz widoku; na standardowych stronach ma wartość `undefined`.
- Używaj opcjonalnego łańcuchowania: `ctx.view?.close?.()`, aby uniknąć błędów, gdy kontekst widoku nie istnieje.
- Wynik `result` z `close(result)` jest przekazywany do obietnicy (Promise) zwróconej przez `ctx.viewer.open()`.

## Powiązane

- [ctx.openView()](./open-view.md): Otwórz wstępnie skonfigurowany widok przepływu pracy
- [ctx.modal](./modal.md): Lekkie okna wyskakujące (informacje, potwierdzenia itp.)

> `ctx.viewer` udostępnia metody takie jak `dialog()`, `drawer()`, `popover()` i `embed()` do otwierania widoków. Treść (`content`) otwarta za pomocą tych metod ma dostęp do `ctx.view`.
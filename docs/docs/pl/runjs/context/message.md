:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/message).
:::

# ctx.message

Globalne API komunikatów (message) Ant Design, służące do wyświetlania tymczasowych, lekkich powiadomień w górnej środkowej części strony. Komunikaty zamykają się automatycznie po określonym czasie lub mogą zostać zamknięte ręcznie przez użytkownika.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Informacje zwrotne o operacjach, komunikaty walidacji, potwierdzenie skopiowania i inne lekkie powiadomienia |
| **Operacje na formularzach / Przepływ pracy** | Informacje zwrotne o sukcesie przesłania, błędzie zapisu, niepowodzeniu walidacji itp. |
| **Zdarzenia akcji (JSAction)** | Natychmiastowe informacje zwrotne po kliknięciu, zakończeniu operacji masowych itp. |

## Definicja typu

```ts
message: MessageInstance;
```

`MessageInstance` to interfejs komunikatów Ant Design, który udostępnia następujące metody.

## Często używane metody

| Metoda | Opis |
|------|------|
| `success(content, duration?)` | Wyświetla komunikat o sukcesie |
| `error(content, duration?)` | Wyświetla komunikat o błędzie |
| `warning(content, duration?)` | Wyświetla ostrzeżenie |
| `info(content, duration?)` | Wyświetla informację |
| `loading(content, duration?)` | Wyświetla komunikat ładowania (wymaga ręcznego zamknięcia) |
| `open(config)` | Otwiera komunikat przy użyciu niestandardowej konfiguracji |
| `destroy()` | Zamyka wszystkie aktualnie wyświetlane komunikaty |

**Parametry:**

- `content` (`string` | `ConfigOptions`): Treść komunikatu lub obiekt konfiguracji
- `duration` (`number`, opcjonalnie): Opóźnienie automatycznego zamknięcia (w sekundach), domyślnie 3 sekundy; ustawienie 0 wyłącza automatyczne zamykanie

**ConfigOptions** (gdy `content` jest obiektem):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Treść komunikatu
  duration?: number;        // Opóźnienie automatycznego zamknięcia (sekundy)
  onClose?: () => void;    // Funkcja zwrotna po zamknięciu
  icon?: React.ReactNode;  // Niestandardowa ikona
}
```

## Przykłady

### Podstawowe użycie

```ts
ctx.message.success('Operacja zakończona sukcesem');
ctx.message.error('Operacja nie powiodła się');
ctx.message.warning('Proszę najpierw wybrać dane');
ctx.message.info('Przetwarzanie...');
```

### Internacjonalizacja z ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Ładowanie i ręczne zamykanie

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Wykonaj operację asynchroniczną
await saveData();
hide();  // Ręczne zamknięcie ładowania
ctx.message.success(ctx.t('Saved'));
```

### Niestandardowa konfiguracja za pomocą open

```ts
ctx.message.open({
  type: 'success',
  content: 'Niestandardowy komunikat o sukcesie',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Zamykanie wszystkich komunikatów

```ts
ctx.message.destroy();
```

## Różnica między ctx.message a ctx.notification

| Cecha | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Pozycja** | Góra strony, na środku | Prawy górny róg |
| **Cel** | Tymczasowe lekkie powiadomienie, znika automatycznie | Panel powiadomień, może zawierać tytuł i opis, odpowiedni do dłuższego wyświetlania |
| **Typowe scenariusze** | Informacje zwrotne o operacjach, komunikaty walidacji, sukces kopiowania | Powiadomienia o zakończeniu zadań, wiadomości systemowe, dłuższe treści wymagające uwagi użytkownika |

## Powiązane

- [ctx.notification](./notification.md) - Powiadomienia w prawym górnym rogu, odpowiednie dla dłuższego czasu wyświetlania
- [ctx.modal](./modal.md) - Okno modalne z potwierdzeniem, interakcja blokująca
- [ctx.t()](./t.md) - Internacjonalizacja, często używana razem z message
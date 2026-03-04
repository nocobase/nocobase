:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/notification).
:::

# ctx.notification

Oparte na Ant Design Notification, to globalne API powiadomień służy do wyświetlania paneli powiadomień w **prawym górnym rogu** strony. W porównaniu do `ctx.message`, powiadomienia mogą zawierać tytuł i opis, co sprawia, że nadają się do treści wymagających dłuższego wyświetlania lub uwagi użytkownika.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSBlock / Zdarzenia operacji** | Powiadomienia o zakończeniu zadania, wyniki operacji masowych, zakończenie eksportu itp. |
| **Przepływ zdarzeń** | Alerty na poziomie systemu po zakończeniu procesów asynchronicznych. |
| **Treści wymagające dłuższego wyświetlania** | Pełne powiadomienia z tytułami, opisami i przyciskami akcji. |

## Definicja typu

```ts
notification: NotificationInstance;
```

`NotificationInstance` to interfejs powiadomień Ant Design, udostępniający następujące metody.

## Typowe metody

| Metoda | Opis |
|------|------|
| `open(config)` | Otwiera powiadomienie z niestandardową konfiguracją |
| `success(config)` | Wyświetla powiadomienie typu "sukces" |
| `info(config)` | Wyświetla powiadomienie informacyjne |
| `warning(config)` | Wyświetla powiadomienie ostrzegawcze |
| `error(config)` | Wyświetla powiadomienie o błędzie |
| `destroy(key?)` | Zamyka powiadomienie o określonym kluczu; jeśli nie podano klucza, zamyka wszystkie |

**Parametry konfiguracji** (zgodne z [Ant Design notification](https://ant.design/components/notification)):

| Parametr | Typ | Opis |
|------|------|------|
| `message` | `ReactNode` | Tytuł powiadomienia |
| `description` | `ReactNode` | Opis powiadomienia |
| `duration` | `number` | Opóźnienie automatycznego zamknięcia (w sekundach). Domyślnie 4,5 sekundy; ustawienie 0 wyłącza automatyczne zamykanie |
| `key` | `string` | Unikalny identyfikator powiadomienia, używany w `destroy(key)` do zamykania konkretnego powiadomienia |
| `onClose` | `() => void` | Funkcja zwrotna wywoływana po zamknięciu powiadomienia |
| `placement` | `string` | Położenie: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Przykłady

### Podstawowe użycie

```ts
ctx.notification.open({
  message: 'Operacja zakończona sukcesem',
  description: 'Dane zostały zapisane na serwerze.',
});
```

### Skrócone wywołania według typu

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Niestandardowy czas trwania i klucz

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Nie zamykaj automatycznie
});

// Ręczne zamknięcie po zakończeniu zadania
ctx.notification.destroy('task-123');
```

### Zamykanie wszystkich powiadomień

```ts
ctx.notification.destroy();
```

## Różnica względem ctx.message

| Cecha | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Pozycja** | Góra strony, na środku | Prawy górny róg (konfigurowalne) |
| **Struktura** | Jednowierszowa lekka wskazówka | Może zawierać tytuł + opis |
| **Zastosowanie** | Tymczasowa informacja zwrotna, znika automatycznie | Pełne powiadomienie, może być wyświetlane przez dłuższy czas |
| **Typowe scenariusze** | Sukces operacji, błąd walidacji, sukces kopiowania | Zakończenie zadania, komunikaty systemowe, dłuższe treści wymagające uwagi użytkownika |

## Powiązane

- [ctx.message](./message.md) - Lekka wskazówka na górze, odpowiednia dla szybkich informacji zwrotnych
- [ctx.modal](./modal.md) - Potwierdzenie w oknie modalnym, interakcja blokująca
- [ctx.t()](./t.md) - Internacjonalizacja, często używana w połączeniu z powiadomieniami
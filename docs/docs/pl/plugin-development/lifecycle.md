:::tip Powiadomienie o tłumaczeniu AI
Ta dokumentacja została automatycznie przetłumaczona przez AI.
:::


# Cykl życia

W tej sekcji porządkujemy haki cyklu życia dla wtyczek, zarówno po stronie serwera, jak i klienta, aby pomóc deweloperom poprawnie rejestrować i zwalniać zasoby.

Warto porównać to z cyklem życia FlowModel, aby podkreślić wspólne koncepcje.

## Sugerowana zawartość

- Funkcje zwrotne wywoływane, gdy wtyczki są instalowane, włączane, wyłączane lub usuwane.
- Moment montowania, aktualizacji i niszczenia komponentów po stronie klienta.
- Zalecenia dotyczące obsługi zadań asynchronicznych i błędów w ramach cyklu życia.
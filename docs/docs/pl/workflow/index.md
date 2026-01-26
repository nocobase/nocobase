---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Przegląd

## Wprowadzenie

Wtyczka przepływu pracy pomaga Panu/Pani organizować zautomatyzowane procesy biznesowe w NocoBase, takie jak codzienne zatwierdzenia, synchronizacja danych, przypomnienia i inne zadania. W ramach przepływu pracy może Pan/Pani zaimplementować złożoną logikę biznesową, konfigurując wyzwalacze i powiązane węzły za pomocą interfejsu wizualnego, bez konieczności pisania kodu.

### Przykład

Każdy przepływ pracy organizowany jest za pomocą wyzwalacza i kilku węzłów. Wyzwalacz reprezentuje zdarzenie w systemie, a każdy węzeł reprezentuje krok wykonania. Razem opisują one logikę biznesową, która ma zostać przetworzona po wystąpieniu zdarzenia. Poniższy obraz przedstawia typowy proces zmniejszania stanu magazynowego po złożeniu zamówienia na produkt:

![Przykład przepływu pracy](https://static-docs.nocobase.com/20251029222146.png)

Gdy użytkownik złoży zamówienie, przepływ pracy automatycznie sprawdza stan magazynowy. Jeśli stan magazynowy jest wystarczający, system zmniejsza zapasy i kontynuuje tworzenie zamówienia; w przeciwnym razie proces zostaje zakończony.

### Scenariusze użycia

Z bardziej ogólnej perspektywy, przepływy pracy w aplikacjach NocoBase mogą rozwiązywać problemy w różnych scenariuszach:

- Automatyzacja powtarzalnych zadań: Przeglądy zamówień, synchronizacja zapasów, czyszczenie danych, obliczanie wyników itp. nie wymagają już ręcznej obsługi.
- Wspieranie współpracy człowiek-maszyna: Organizowanie zatwierdzeń lub przeglądów w kluczowych węzłach i kontynuowanie kolejnych kroków w oparciu o wyniki.
- Łączenie z systemami zewnętrznymi: Wysyłanie żądań HTTP, odbieranie powiadomień z usług zewnętrznych i osiąganie automatyzacji między systemami.
- Szybkie dostosowywanie się do zmian biznesowych: Dostosowywanie struktury procesów, warunków lub innych konfiguracji węzłów i uruchamianie ich bez nowej wersji.

## Instalacja

Przepływ pracy to wbudowana wtyczka NocoBase. Nie wymaga dodatkowej instalacji ani konfiguracji.

## Dowiedz się więcej

- [Pierwsze kroki](./getting-started)
- [Wyzwalacze](./triggers/index)
- [Węzły](./nodes/index)
- [Używanie zmiennych](./advanced/variables)
- [Wykonania](./advanced/executions)
- [Zarządzanie wersjami](./advanced/revisions)
- [Zaawansowana konfiguracja](./advanced/options)
- [Rozwój rozszerzeń](./development/index)
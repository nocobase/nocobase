:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozdzielanie usług <Badge>v1.9.0+</Badge>

## Wprowadzenie

Zazwyczaj wszystkie usługi aplikacji NocoBase działają w ramach tej samej instancji Node.js. W miarę jak funkcjonalności w aplikacji stają się coraz bardziej złożone wraz z rozwojem biznesu, niektóre czasochłonne usługi mogą negatywnie wpływać na ogólną wydajność.

Aby poprawić wydajność aplikacji, NocoBase umożliwia rozdzielanie usług aplikacji i uruchamianie ich na różnych węzłach w trybie klastrowym. Zapobiega to sytuacji, w której problemy z wydajnością pojedynczej usługi wpływają na całą aplikację, uniemożliwiając prawidłową obsługę żądań użytkowników. Ponadto, pozwala to na ukierunkowane skalowanie horyzontalne konkretnych usług, co zwiększa efektywność wykorzystania zasobów klastra.

Podczas wdrażania NocoBase w klastrze, różne usługi mogą być rozdzielone i uruchamiane na różnych węzłach. Poniższy diagram ilustruje strukturę podziału:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Które usługi można rozdzielić

### Asynchroniczny przepływ pracy

**KLUCZ USŁUGI**: `workflow:process`

Przepływy pracy w trybie asynchronicznym, po uruchomieniu, trafiają do kolejki w celu wykonania. Można je traktować jako zadania wykonywane w tle, a użytkownicy zazwyczaj nie muszą czekać na zwrócenie wyników. Szczególnie w przypadku złożonych i czasochłonnych procesów, które są często uruchamiane, zaleca się rozdzielenie ich i uruchamianie na niezależnych węzłach.

### Inne asynchroniczne zadania na poziomie użytkownika

**KLUCZ USŁUGI**: `async-task:process`

Obejmuje to zadania tworzone przez działania użytkownika, takie jak asynchroniczny import i eksport. W przypadku dużych ilości danych lub wysokiej współbieżności, zaleca się rozdzielenie ich i uruchamianie na niezależnych węzłach.

## Jak rozdzielić usługi

Rozdzielanie różnych usług na różne węzły odbywa się poprzez konfigurację zmiennej środowiskowej `WORKER_MODE`. Zmienną tę można skonfigurować zgodnie z poniższymi zasadami:

- `WORKER_MODE=<puste>`: Gdy zmienna nie jest skonfigurowana lub jest pusta, tryb pracy jest taki sam jak w przypadku pojedynczej instancji – akceptuje wszystkie żądania i przetwarza wszystkie zadania. Jest to zgodne z aplikacjami, które nie były wcześniej konfigurowane.
- `WORKER_MODE=!`: Tryb pracy polega wyłącznie na przetwarzaniu żądań, bez obsługi jakichkolwiek zadań.
- `WORKER_MODE=workflow:process,async-task:process`: Skonfigurowana z jednym lub więcej identyfikatorami usług (rozdzielonymi przecinkami), tryb pracy polega wyłącznie na przetwarzaniu zadań dla tych identyfikatorów, bez obsługi żądań.
- `WORKER_MODE=*`: Tryb pracy polega na przetwarzaniu wszystkich zadań w tle, niezależnie od modułu, ale bez obsługi żądań.
- `WORKER_MODE=!,workflow:process`: Tryb pracy polega na przetwarzaniu żądań i jednocześnie przetwarzaniu zadań dla określonego identyfikatora.
- `WORKER_MODE=-`: Tryb pracy polega na nieprzetwarzaniu żadnych żądań ani zadań (ten tryb jest wymagany w procesie roboczym).

Na przykład w środowisku K8S, węzły o tej samej funkcjonalności podziału mogą używać tej samej konfiguracji zmiennych środowiskowych, co ułatwia horyzontalne skalowanie określonego typu usługi.

## Przykłady konfiguracji

### Wiele węzłów z oddzielnym przetwarzaniem

Załóżmy, że istnieją trzy węzły: `node1`, `node2` i `node3`. Można je skonfigurować w następujący sposób:

- `node1`: Przetwarza wyłącznie żądania interfejsu użytkownika, konfiguracja `WORKER_MODE=!`.
- `node2`: Przetwarza wyłącznie zadania przepływu pracy, konfiguracja `WORKER_MODE=workflow:process`.
- `node3`: Przetwarza wyłącznie zadania asynchroniczne, konfiguracja `WORKER_MODE=async-task:process`.

### Wiele węzłów z mieszanym przetwarzaniem

Załóżmy, że istnieją cztery węzły: `node1`, `node2`, `node3` i `node4`. Można je skonfigurować w następujący sposób:

- `node1` i `node2`: Przetwarzają wszystkie regularne żądania, konfiguracja `WORKER_MODE=!`, a system równoważenia obciążenia automatycznie rozdziela żądania między te dwa węzły.
- `node3` i `node4`: Przetwarzają wszystkie inne zadania w tle, konfiguracja `WORKER_MODE=*`.

## Odnośnik dla programistów

Podczas tworzenia wtyczek biznesowych, mogą Państwo rozdzielać usługi, które zużywają znaczne zasoby, w zależności od wymagań scenariusza. Można to osiągnąć w następujący sposób:

1. Zdefiniuj nowy identyfikator usługi, na przykład `my-plugin:process`, do konfiguracji zmiennych środowiskowych i zapewnij dla niego dokumentację.
2. W logice biznesowej po stronie serwera wtyczki, użyj interfejsu `app.serving()` do sprawdzenia środowiska i określenia, czy bieżący węzeł powinien świadczyć daną usługę na podstawie zmiennej środowiskowej.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// W kodzie po stronie serwera wtyczki
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Przetwarzanie logiki biznesowej dla tej usługi
} else {
  // Nie przetwarzanie logiki biznesowej dla tej usługi
}
```
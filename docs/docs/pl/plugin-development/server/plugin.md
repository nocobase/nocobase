:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wtyczka

W NocoBase, wtyczka zapewnia modułowy sposób na rozszerzanie i dostosowywanie funkcjonalności po stronie serwera. Deweloperzy mogą dziedziczyć po klasie `Plugin` z `@nocobase/server`, aby rejestrować zdarzenia, interfejsy API, konfiguracje uprawnień i inną niestandardową logikę na różnych etapach cyklu życia.

## Klasa wtyczki

Podstawowa struktura klasy wtyczki wygląda następująco:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Cykl życia

Metody cyklu życia wtyczki są wykonywane w następującej kolejności. Każda metoda ma swój specyficzny czas wykonania i przeznaczenie:

| Metoda cyklu życia | Czas wykonania | Opis |
|--------------------|----------------|------|
| **staticImport()** | Przed załadowaniem wtyczki | Statyczna metoda klasy, wykonywana podczas fazy inicjalizacji niezależnej od stanu aplikacji lub wtyczki. Służy do prac inicjalizacyjnych, które nie zależą od instancji wtyczki. |
| **afterAdd()** | Wykonywana natychmiast po dodaniu wtyczki do menedżera wtyczek | Instancja wtyczki została już utworzona, ale nie wszystkie wtyczki zakończyły inicjalizację. Można tu wykonać podstawowe prace inicjalizacyjne. |
| **beforeLoad()** | Wykonywana przed metodą `load()` wszystkich wtyczek | W tym momencie można uzyskać dostęp do wszystkich **włączonych instancji wtyczek**. Nadaje się do rejestrowania modeli baz danych, nasłuchiwania zdarzeń baz danych, rejestrowania middleware i innych prac przygotowawczych. |
| **load()** | Wykonywana podczas ładowania wtyczki | Metoda `load()` rozpoczyna się dopiero po zakończeniu wszystkich metod `beforeLoad()` wtyczek. Nadaje się do rejestrowania zasobów, interfejsów API, usług i innej podstawowej logiki biznesowej. |
| **install()** | Wykonywana przy pierwszej aktywacji wtyczki | Wykonywana tylko raz, gdy wtyczka zostanie po raz pierwszy włączona. Zazwyczaj służy do inicjalizacji struktur tabel baz danych, wstawiania początkowych danych i innej logiki instalacyjnej. |
| **afterEnable()** | Wykonywana po włączeniu wtyczki | Wykonywana za każdym razem, gdy wtyczka jest włączana. Może być używana do uruchamiania zadań cyklicznych, rejestrowania zadań zaplanowanych, nawiązywania połączeń i innych działań po włączeniu. |
| **afterDisable()** | Wykonywana po wyłączeniu wtyczki | Wykonywana, gdy wtyczka jest wyłączana. Może być używana do czyszczenia zasobów, zatrzymywania zadań, zamykania połączeń i innych prac porządkowych. |
| **remove()** | Wykonywana po usunięciu wtyczki | Wykonywana, gdy wtyczka jest całkowicie usuwana. Służy do implementacji logiki odinstalowywania, takiej jak usuwanie tabel baz danych, czyszczenie plików itp. |
| **handleSyncMessage(message)** | Synchronizacja wiadomości w przypadku wdrożenia wielowęzłowego | Gdy aplikacja działa w trybie wielowęzłowym, służy do obsługi wiadomości synchronizowanych z innych węzłów. |

### Opis kolejności wykonania

Typowy przepływ wykonania metod cyklu życia:

1. **Faza statycznej inicjalizacji**: `staticImport()`
2. **Faza uruchamiania aplikacji**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Faza pierwszego włączenia wtyczki**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Faza ponownego włączenia wtyczki**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Faza wyłączania wtyczki**: Metoda `afterDisable()` jest wykonywana podczas wyłączania wtyczki.
6. **Faza usuwania wtyczki**: Metoda `remove()` jest wykonywana podczas usuwania wtyczki.

## `app` i powiązane elementy

Podczas tworzenia wtyczek, poprzez `this.app` można uzyskać dostęp do różnych interfejsów API udostępnianych przez instancję aplikacji. Stanowi to podstawowy interfejs do rozszerzania funkcjonalności wtyczki. Obiekt `app` zawiera różne moduły funkcjonalne systemu. Deweloperzy mogą używać tych modułów w metodach cyklu życia wtyczki, aby implementować wymagania biznesowe.

### Lista elementów `app`

| Nazwa elementu | Typ/Moduł | Główne przeznaczenie |
|----------------|------------|----------------------|
| **logger** | `Logger` | Rejestruje logi systemowe, obsługuje wyświetlanie logów na różnych poziomach (info, warn, error, debug), ułatwiając debugowanie i monitorowanie. Zobacz [Logowanie](./logger.md) |
| **db** | `Database` | Zapewnia operacje na warstwie ORM, rejestrację modeli, nasłuchiwanie zdarzeń, kontrolę transakcji i inne funkcje związane z bazami danych. Zobacz [Baza danych](./database.md). |
| **resourceManager** | `ResourceManager` | Służy do rejestrowania i zarządzania zasobami REST API oraz procedurami obsługi operacji. Zobacz [Zarządzanie zasobami](./resource-manager.md). |
| **acl** | `ACL` | Warstwa kontroli dostępu, służy do definiowania uprawnień, ról i polityk dostępu do zasobów, implementując szczegółową kontrolę uprawnień. Zobacz [Kontrola dostępu](./acl.md). |
| **cacheManager** | `CacheManager` | Zarządza pamięcią podręczną na poziomie systemu, obsługuje różne backendy pamięci podręcznej, takie jak Redis, pamięć podręczna oparta na pamięci RAM, aby poprawić wydajność aplikacji. Zobacz [Pamięć podręczna](./cache.md) |
| **cronJobManager** | `CronJobManager` | Służy do rejestrowania, uruchamiania i zarządzania zadaniami cyklicznymi, obsługuje konfigurację wyrażeń Cron. Zobacz [Zadania cykliczne](./cron-job-manager.md) |
| **i18n** | `I18n` | Obsługa internacjonalizacji, zapewnia funkcje tłumaczeń wielojęzycznych i lokalizacji, ułatwiając wtyczkom obsługę wielu języków. Zobacz [Internacjonalizacja](./i18n.md) |
| **cli** | `CLI` | Zarządza interfejsem wiersza poleceń, rejestruje i wykonuje niestandardowe polecenia, rozszerza funkcjonalność NocoBase CLI. Zobacz [Wiersz poleceń](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Zarządza wieloma instancjami źródła danych i ich połączeniami, obsługuje scenariusze z wieloma źródłami danych. Zobacz [Zarządzanie źródłami danych](./collections.md) |
| **pm** | `PluginManager` | Menedżer wtyczek, służy do dynamicznego ładowania, włączania, wyłączania i usuwania wtyczek, zarządzania zależnościami między wtyczkami. |

> Uwaga: Aby uzyskać szczegółowe informacje na temat użycia każdego modułu, proszę zapoznać się z odpowiednimi rozdziałami dokumentacji.
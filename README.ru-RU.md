[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | Русский | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

[▶ Смотреть демо](https://static-docs.nocobase.com/nocobase-3-ru.mp4)

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Что такое NocoBase

NocoBase — платформа с открытым кодом для разработки, работы и развития бизнес-систем с ИИ. Агенты пишут код и выполняют работу, NocoBase даёт фундамент и контроль, а решения принимают люди.

[Сайт](https://www.nocobase.com/ru-RU/) · [Документация](https://docs.nocobase.com/) · [Быстрый старт](#quick-start) · [Сообщество](https://forum.nocobase.com/)

## Зачем нужен NocoBase

**ИИ пишет код быстро. Но создать надёжную бизнес-систему по-прежнему непросто.**

Ваша команда уже разрабатывает с ИИ или занимается вайб-кодингом. Код пишется быстро, но появляются новые проблемы.

- **Фундамент каждый раз с нуля**

  Даже если код пишет ИИ, права доступа, движок бизнес-процессов и согласования сложно спроектировать с нуля. Много пограничных случаев, а поддержка отнимает много сил.

- **Архитектура выходит из-под контроля**

  Смените разработчика, модель или даже сессию, и ИИ каждый раз может импровизировать по-своему. Систему всё труднее поддерживать.

- **Параллельной работы больше, чем можно проверить**

  Вы ведёте несколько проектов и задач, переключаетесь между терминалами и чатами, а агенты присылают всё больше изменений. Проверить всё невозможно, а отпустить контроль слишком рискованно.

- **Знания трудно сохранить и передать**

  Контекст требований, бизнес-документы и накопленный опыт разбросаны по чатам на разных компьютерах. Когда меняются люди или агенты, найти их почти невозможно.

<a id="quick-start"></a>

## Быстрый старт

Требуются Node.js 24+ и pnpm 11. В Windows используйте WSL. В примерах используется SQLite, поэтому отдельный сервер базы данных не нужен.

### С помощью агента для разработки

Откройте агент для разработки с поддержкой Skills в пустом каталоге и установите Skill для создания приложений:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

При установке выберите своего агента. Если он не распознаёт новый Skill, начните новый сеанс. Затем отправьте:

```text
Следуй Skill nocobase-create-app, чтобы создать и запустить приложение NocoBase 3 в текущем пустом каталоге, используя стандартный шаблон и SQLite.
```

### Через терминал

Выполните следующие команды в родительском каталоге, где хранятся ваши проекты:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Дополнительные инструкции по настройке и разработке доступны в [документации](https://docs.nocobase.com/).

## Экосистема NocoBase

- **[NocoBase Core](https://www.nocobase.com/ru-RU/core/)**

  **Пусть агенты займутся бизнес-логикой. Фундамент уже готов.**

  NocoBase Core — фундамент приложений с открытым кодом для бизнес-систем, которые создаются и работают с ИИ. Права доступа, бизнес-процессы, файлы и другие базовые модули готовы к работе, поэтому агенты разрабатывают только то, что относится к вашему бизнесу, на единой архитектуре.

- **[NocoBase Studio](https://www.nocobase.com/ru-RU/studio/)**

  **Агенты сами двигают работу вперёд. Команда держит всё под контролем.**

  NocoBase Studio — платформа управляемой разработки для совместной работы людей и агентов. Она объединяет Claude Code, Codex и OpenCode в одну команду агентов, которая сама продвигает задачи. Весь прогресс как на ладони, а ключевые решения принимают люди.

- **[NocoBase Solution](https://www.nocobase.com/ru-RU/solutions/)**

  **Бизнес-приложения с открытым кодом. На основе ИИ, готовы к работе.**

  NocoBase Solution — линейка бизнес-приложений на основе агентов, построенных на Core. Большую часть работы выполняют агенты, а люди принимают только ключевые решения.

## Сообщество и участие в разработке

- Задавайте вопросы и делитесь опытом на [форуме сообщества](https://forum.nocobase.com/).
- Сообщайте о воспроизводимых ошибках и предлагайте улучшения через [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Читайте [документацию](https://docs.nocobase.com/), чтобы узнать, как работают фреймворк и плагины.

Мы приветствуем ваш вклад. Прежде чем менять этот репозиторий, прочитайте [AGENTS.md](./AGENTS.md) и инструкции по разработке, относящиеся к вашим изменениям.

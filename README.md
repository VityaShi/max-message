# MAX-чат (GREEN-API)

Минималистичный веб-чат на React + TypeScript для отправки и получения **текстовых** сообщений в MAX через [GREEN-API](https://green-api.com/max).

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173), введите `idInstance` и `apiTokenInstance` из личного кабинета GREEN-API.

## Требования к GREEN-API аккаунту

1. Создайте инстанс и **отсканируйте QR-код в MAX** через [console.green-api.com](https://console.green-api.com) — приложение не делает это за вас.
2. Для HTTP API polling установите `webhookUrl=""` и `incomingWebhook="yes"` методом `SetSettings`. Без этого `receiveNotification` будет возвращать только `null`.

## Скрипты

- `npm run dev` — Vite dev-сервер
- `npm run build` — production-сборка + `tsc -b` typecheck
- `npm run lint` — oxlint
- `npm run preview` — просмотр production-сборки

## Архитектура (Feature-Sliced Design)

```
src/
  app/        композиция и провайдеры приложения (main.tsx, App.tsx, глобальные стили)
  pages/      страничные композиции (ChatPage)
  widgets/     самостоятельные UI-блоки (chat-header, chat-window, sidebar, toast)
  features/   пользовательские сценарии (auth, create-chat, remove-chat)
  entities/   бизнес-сущности (chat, message) — модель, UI, lib
  shared/     переиспользуемые модули без бизнес-смысла (api, config, types, lib)
```

- **`shared/api/greenApi.ts`** — `fetch`-обёртки `sendMessage`, `receiveNotification`, `deleteNotification` (`waInstance{idInstance}/.../{apiTokenInstance}`).
- **`entities/chat/model/useChats.ts`** — стейт чатов и сообщений, polling (3 с, экспоненциальный backoff до 30 с), оптимистичные апдейты, retry.
- **`widgets/chat-window`** — `ChatHeader` + `MessageList` + `MessageInput` (композиция для активного чата).
- **`widgets/sidebar`** — список чатов с превью последнего сообщения.
- **`widgets/toast`** — индикатор состояния соединения (`reconnecting` / `offline`).

Импорты между слоями идут только сверху вниз (pages → widgets → features → entities → shared); обратные запрещены.

## Персистентность

- **`max-chat:credentials`** — idInstance + apiTokenInstance (localStorage). Очищается кнопкой «Сбросить авторизацию» в пустом чате.
- **`max-chat:chats`** — массив всех чатов с историей сообщений (localStorage).
- **`max-chat:active`** — id активного чата (localStorage).

Перезагрузка вкладки сохраняет и сессию, и переписку.
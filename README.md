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

## Архитектура

- `src/api/greenApi.ts` — `fetch`-обёртки `sendMessage`, `receiveNotification`, `deleteNotification` (`waInstance{idInstance}/.../{apiTokenInstance}`).
- `src/hooks/useChat.ts` — стейт сообщений, polling (3 с, экспоненциальный backoff до 30 с), оптимистичные апдейты, retry.
- `src/components/*` — `AuthForm`, `ChatForm`, `ChatHeader`, `MessageList`, `MessageInput` (CSS Modules).
- Сессия и сообщения хранятся только в памяти — перезагрузка вкладки стирает их (по требованию ТЗ «минимальный набор функций»).# max-message

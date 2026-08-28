# CNC Тренажёр

Telegram Mini App для обучения программированию токарных станков с ЧПУ (стойка Fanuc 0i/21i).
Формат — тест как экзамен ПДД: вопрос, 4 варианта, обязательный разбор после ответа.
3 уровня × 4 урока, 99 вопросов.

- Бот: [@cnc_trener_bot](https://t.me/cnc_trener_bot)
- Приложение: https://molodoyromantik.github.io/tg-cnc/
- API: https://tg-cnc-api.lbvfdgfdfgdf.workers.dev

## Структура

```
src/            фронтенд (React + TypeScript + Vite)
  data/         содержимое курса — единственный источник контента (curriculum.js оригинала)
  components/   экраны: Home, Lesson, Quiz, Result, ReviewAnswer, Profile
  state/        useProgress — прогресс/XP/серии, синхронизируется с API
  telegram.ts   интеграция с Telegram WebApp (тема, BackButton, HapticFeedback, initData)
worker/         бэкенд (Cloudflare Worker + D1), отдельный npm-пакет
  src/index.ts        API: GET/POST /api/progress
  src/telegramAuth.ts проверка подписи initData (HMAC), без нее прогресс не пишется
  schema.sql          схема D1
```

## Деплой

Полностью автоматический — деплой запускается пушем в `main`, руками ничего катить не нужно.

- `.github/workflows/deploy.yml` — собирает фронтенд и публикует на GitHub Pages.
- `.github/workflows/deploy-worker.yml` — тайпчекает и деплоит воркер (срабатывает только
  при изменениях в `worker/**`).

## Локальная разработка

```bash
npm install
npm run dev          # фронтенд, http://localhost:5173

cd worker
npm install
npm run dev           # воркер локально (wrangler dev)
npm run typecheck
```

Прогресс синхронизируется только внутри настоящего Telegram-клиента (нужен подписанный
`initData`) — при локальном открытии в браузере состояние живёт только в памяти вкладки.

## Переменные и секреты

Хранятся в GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) и в Cloudflare
Worker secrets (`BOT_TOKEN`, см. `wrangler secret put`). В репозитории секретов нет.

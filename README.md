# CNC Тренажёр

Telegram Mini App для обучения программированию токарных станков с ЧПУ (стойка Fanuc 0i/21i).
Формат — тест как экзамен ПДД: вопрос, 4 варианта, обязательный разбор после ответа.
3 уровня × 4 урока, 99 вопросов. В разборе можно спросить ИИ-репетитора, если что-то непонятно.

- Бот: [@cnc_trener_bot](https://t.me/cnc_trener_bot)
- Приложение: https://molodoyromantik.github.io/tg-cnc/
- API: https://tg-cnc-api.lbvfdgfdfgdf.workers.dev
- Staging API (отдельная БД, для экспериментов): https://tg-cnc-api-staging.lbvfdgfdfgdf.workers.dev

## Структура

```
src/            фронтенд (React + TypeScript + Vite)
  data/         содержимое курса — единственный источник контента (curriculum.js оригинала)
  components/   экраны: Home, Lesson, Quiz, Result, ReviewAnswer, Profile, TutorChat
  state/        useProgress — прогресс/XP/серии, синхронизируется с API
  lib/          чистые функции (quiz.ts, tutor.ts, api.ts) — большинство тестов здесь
  telegram.ts   интеграция с Telegram WebApp (тема, BackButton, HapticFeedback, initData)
worker/         бэкенд (Cloudflare Worker + D1), отдельный npm-пакет
  src/index.ts         API: GET/POST /api/progress, POST /api/tutor
  src/telegramAuth.ts  проверка подписи initData (HMAC), без неё прогресс не пишется
  src/tutor.ts         вызов DeepSeek для ИИ-репетитора
  migrations/          версионированная схема D1 (wrangler d1 migrations)
```

## Деплой

Полностью автоматический — деплой запускается пушем в `main`, руками ничего катить не нужно.

- `.github/workflows/deploy.yml` — тесты, сборка фронтенда, публикация на GitHub Pages.
- `.github/workflows/deploy-worker.yml` — тайпчек, тесты, деплой воркера (срабатывает только
  при изменениях в `worker/**`).

Staging (`tg-cnc-api-staging`) деплоится вручную: `npm run deploy:staging` и
`npm run db:migrate:staging` из `worker/` — для проверки схемы/логики без риска для боевых данных.

## Локальная разработка

```bash
npm install
npm run dev          # фронтенд, http://localhost:5173
npm test              # тесты фронтенда (vitest)

cd worker
npm install
npm run dev           # воркер локально (wrangler dev)
npm run typecheck
npm test              # тесты воркера (vitest) — в т.ч. проверка подписи initData
```

Прогресс и ИИ-репетитор работают только внутри настоящего Telegram-клиента (нужен подписанный
`initData`) — при локальном открытии в браузере состояние живёт только в памяти вкладки.

## Переменные и секреты

Хранятся в GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) и в Cloudflare
Worker secrets (`BOT_TOKEN`, `DEEPSEEK_API_KEY` — см. `wrangler secret put`, задаются отдельно для
`--env staging`). В репозитории секретов нет.

## ИИ-репетитор

`POST /api/tutor` — принимает контекст вопроса (текст, варианты, правильный ответ, разбор) и
сообщение ученика, обращается к DeepSeek (`deepseek-chat`), возвращает ответ. Системный промпт
жёстко ограничивает тему (только ЧПУ-программирование) и просит игнорировать инструкции,
вставленные в сообщения пользователя. Защита от расхода бюджета: отдельный частый rate-limit
(6 запросов/мин на пользователя) + общий дневной потолок числа запросов (таблица `ai_usage`).

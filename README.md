# Создание плагина криптопровайдера для Pilot-Web

## Введение

В этой статье мы рассмотрим создание плагина криптопровайдера для системы управления документами Pilot-Web.

Из коробки веб-версия Pilot-ICE Enterprise работает с КриптоПро ЭЦП Browser plug-in, который использует формат электронной подписи CADES-BES. Это покрывает потребности большинства российских организаций, работающих в соответствии с требованиями ГОСТ.

Однако на практике могут возникнуть ситуации, когда необходимо:
- Использовать альтернативные криптопровайдеры (ruToken, JaCarta, Aktiv и др.)
- Поддержать специфические форматы подписи, требуемые заказчиком
- Интегрироваться с корпоративными системами электронного документооборота
- Работать с международными стандартами подписи (PAdES, XAdES и т.д.)

Для таких случаев Pilot-Web предоставляет возможность создания собственных плагинов криптопровайдеров через открытый SDK.

Для демонстрации основных концепций разработки мы реализуем простой плагин для подписания электронной подписью на базе хеш-функции FNV-1a.

**Важно:** FNV-1a не является криптостойким алгоритмом и используется здесь исключительно в образовательных целях. Для production-среды необходимо использовать сертифицированные криптографические алгоритмы.

## Архитектура плагина

Плагин представляет собой TypeScript-модуль, который подключается к Pilot-Web через механизм Module Federation.

Основной класс `CryptoProviderFnv1Extension` реализует интерфейс `ICryptoProvider` и предоставляет методы для:
- Получения списка сертификатов (`getCertificates`)
- Создания электронной подписи документа (`sign`)
- Проверки подписи (`verify`, `verifyImportedSignature`)
- Определения поддерживаемых алгоритмов (`canProcessAlgorithms`)

Полный код проекта доступен в репозитории на GitHub: [https://github.com/your-repo/cryptoprovider-fnv1-sample](https://github.com/your-repo/cryptoprovider-fnv1-sample)

Основные компоненты:

- **CryptoProviderFnv1Extension** — главный класс, реализующий интерфейс `ICryptoProvider`
- **FileSignatureUpdater** — утилита для обновления подписей в объектах документов
- **Вспомогательные функции** — работа с кодировками и преобразованиями данных

## Структура проекта

Перед началом разработки рассмотрим организацию файлов в проекте:

```
cryptoprovider.fnv1.sample/
│
├── src/
│   ├── app/
│   │   ├── cryptoProviderFnv1Extension.ts    # Главный класс плагина
│   │   ├── file-signature.updater.ts         # Логика обновления подписей
│   │   ├── signature-date-object.interface.ts # Интерфейс данных подписи
│   │   └── utils.ts                          # Вспомогательные функции
│   │
│   ├── assets/
│   │   └── extensions.config.json            # Манифест плагина
│   │
│   └── index.ts                              # Точка входа (пустой файл)
│
├── dist/                                     # Директория сборки (генерируется)
│   ├── main.js                              # Скомпилированный модуль
│   └── extensions.config.json               # Скопированный манифест
│
├── package.json                             # Конфигурация npm и зависимости
├── tsconfig.json                            # Конфигурация TypeScript
├── webpack.config.js                        # Конфигурация Webpack (dev)
└── webpack.prod.config.js                   # Конфигурация Webpack (production)
```

### Назначение ключевых файлов:

**Исходный код (`src/`):**
- `cryptoProviderFnv1Extension.ts` — основная логика криптопровайдера, реализация всех методов интерфейса `ICryptoProvider`
- `file-signature.updater.ts` — класс для работы с Pilot ICE SDK API, модификация объектов документов
- `signature-date-object.interface.ts` — TypeScript-интерфейс для типизации данных подписи
- `utils.ts` — функции для преобразования между ArrayBuffer, строками и Base64
- `index.ts` — формальная точка входа для Webpack (может быть пустым)

**Конфигурация (`assets/`):**
- `extensions.config.json` — манифест, описывающий метаданные плагина и экспортируемые модули

### Поток данных в приложении (Data Flow Diagram):

```
┌─────────────┐
│  Pilot-Web  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│   CryptoProviderFnv1         │
│   Extension                  │
└─────┬────────────────┬───────┘
      │                │
      ▼                ▼
┌─────────────┐  ┌──────────────┐
│   sign()    │  │   verify()   │
└──────┬──────┘  └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ FNV1a Hash   │  │ Декодирование    │
│ Calculation  │  │ подписи          │
└──────┬───────┘  └──────┬───────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ Base64       │  │ Сравнение        │
│ Encoding     │  │ хешей            │
└──────┬───────┘  └──────┬───────────┘
       │                 │
       ▼                 ▼
┌──────────────────┐  ┌─────────────────┐
│ FileSignature    │  │ Результат       │
│ Updater          │  │ проверки        │
└──────┬───────────┘  └─────────────────┘
       │
       ▼
┌──────────────────┐
│ IModifier API    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Сохранение в     │
│ Pilot-Web        │
└──────────────────┘
```

Эта структура обеспечивает четкое разделение ответственности: логика криптографии отделена от работы с API системы, а утилиты вынесены в отдельный модуль.

## Шаг 1: Инициализация проекта

### Создание package.json

Начнем с настройки зависимостей проекта:

```json
{
  "name": "cryptoprovider.fnv1.sample",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "build": "webpack",
    "build-prod": "webpack --config webpack.prod.config.js",
    "start": "webpack serve"
  },
  "dependencies": {
    "@pilotdev/pilot-web-sdk": "^25.13.0",
    "rxjs": "7.8.1"
  },
  "devDependencies": {
    "@types/jsrsasign": "10.5.15",
    "copy-webpack-plugin": "13.0.0",
    "ts-loader": "9.5.2",
    "typescript": "5.8.2",
    "webpack": "5.98.0",
    "webpack-cli": "6.0.1"
  }
}
```

Ключевые зависимости:
- `@pilotdev/pilot-web-sdk` — SDK для разработки плагинов
- `rxjs` — библиотека для работы с асинхронными операциями через реактивное программирование. Используется для обработки потоков данных (Observable), что позволяет элегантно работать с асинхронными операциями подписания и проверки документов. Все методы SDK возвращают Observable, что обеспечивает единообразный подход к обработке асинхронности
- `webpack` — для сборки модуля

### Настройка TypeScript

Создайте `tsconfig.json` с базовыми настройками:

```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## Шаг 2: Конфигурация Webpack

Webpack используется для создания модуля, который можно динамически загрузить в Pilot ICE. Ключевой момент — использование **Module Federation Plugin**.

### webpack.config.js

```javascript
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = [{
    mode: "development",
    entry: {main: './src/index.ts'},
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
    output: {
        publicPath: 'auto',
        uniqueName: 'cryptoprovider_fnv1',
        scriptType: 'text/javascript',
        filename: '[name].js',
        clean: true
    },
    optimization: {
        runtimeChunk: false
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'cryptoprovider_fnv1',
            library: { type: 'var', name: '[name]' },
            filename: '[name].js',
            exposes: [{ 
                ICryptoProvider: './src/app/cryptoProviderFnv1Extension.ts' 
            }],
            shared: {
                '@pilotdev/pilot-web-sdk': {
                    singleton: true,
                }
            }
        }),
        new CopyPlugin({
            patterns: [
                { from: "./src/assets/extensions.config.json", to: "extensions.config.json" }
            ],
        }),
    ],
    devServer: {
        port: 4300,
        allowedHosts: 'auto',
        headers: {
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-time-zone-offset"
        },
    },
}]
```

### Важные моменты конфигурации:

1. **ModuleFederationPlugin** — позволяет экспортировать модуль для динамической загрузки:
    - `name` — уникальное имя модуля
    - `exposes` — какие модули экспортируются (наш криптопровайдер)
    - `shared` — общие зависимости с хост-приложением (SDK должен быть singleton)

2. **CopyPlugin** — копирует конфигурационный файл `extensions.config.json` в output-директорию

3. **devServer** — настройки для разработки с CORS-заголовками

## Шаг 3: Манифест плагина

Создайте `src/assets/extensions.config.json`:

```json
{
  "$schema": "node_modules/@pilotdev/pilot-web-sdk/extensions.config.schema.json",
  "manifestVersion": 1,
  "author": "ASCON JSC",
  "license": "MIT",
  "title": "cryptoprovider.fnv1",
  "description": "Educational plugin demonstrating the creation of a custom cryptographic provider using FNV-1a hashing algorithm for document signing and verification.",
  "version": "1.0.0",
  "extension": {
    "name": "cryptoprovider_fnv1",
    "entry": "cryptoprovider_fnv1.js",
    "modules": [{ 
      "ngModuleName": "CryptoProviderFnv1Extension", 
      "exposedInterface": "ICryptoProvider" 
    }]
  }
}
```

Этот файл описывает метаданные плагина и указывает Pilot-Web, какой интерфейс реализует модуль.

## Шаг 4: Главный класс и вспомогательные файлы

Для полной функциональности плагина необходимо создать вспомогательные модули:

- `src/app/utils.ts` — функции для преобразования между ArrayBuffer, строками и Base64
- `src/app/signature-date-object.interface.ts` — TypeScript-интерфейс для типизации данных подписи
- `src/app/file-signature.updater.ts` — класс для работы с Pilot-Web SDK API и модификации объектов документов
- `src/app/cryptoProviderFnv1Extension.ts` — главный класс плагина с реализацией всех методов интерфейса `ICryptoProvider`

Полную реализацию этих файлов можно посмотреть в репозитории на GitHub: [https://github.com/AlexLazareva/cryptoprovider-fnv1-sample](https://github.com/AlexLazareva/cryptoprovider-fnv1-sample)

## Шаг 5: Точка входа

Создайте пустой `src/index.ts` — он нужен как entry point для webpack, но весь функционал находится в `cryptoProviderFnv1Extension.ts`, который экспортируется через Module Federation.

## Шаг 6: Сборка и запуск

### Режим разработки

```bash
npm install
npm start
```

Webpack запустит dev-сервер на порту 4300 с hot-reload.

### Production-сборка

```bash
npm run build-prod
```

Файлы будут собраны в директорию `dist/`:
- `main.js` — скомпилированный модуль
- `extensions.config.json` — манифест плагина

## Как это работает

1. **Подписание документа**:
    - Пользователь выбирает документ и инициирует подписание
    - Pilot-Web вызывает `getCertificates()` для получения списка сертификатов
    - После выбора сертификата вызывается `sign()`
    - Метод вычисляет FNV-1a хеш файла
    - Создается JSON с метаданными (хеш, дата, субъект, издатель)
    - JSON кодируется в base64
    - Через `FileSignatureUpdater` создается файл подписи и привязывается к документу

2. **Проверка подписи**:
    - Pilot-Web вызывает `verify()` или `verifyImportedSignature()`
    - Декодируется файл подписи
    - Вычисляется хеш текущего файла
    - Сравнивается с хешем из подписи
    - Возвращается результат с статусом и метаданными

## Заключение

Мы создали полноценный плагин криптопровайдера для Pilot-Web:

✅ Настроили webpack с Module Federation для динамической загрузки  
✅ Реализовали все методы интерфейса `ICryptoProvider`  
✅ Использовали SDK API для модификации объектов документов  
✅ Создали систему проверки подписей с кастомными состояниями

Этот пример демонстрирует архитектуру плагинов Pilot-Web и может служить основой для разработки плагинов для подписания электронной подписью с реальными криптографическими библиотеками (CryptoPro CSP, КриптоПро ЭЦП Browser Plugin, ruToken и др.).

### Дальнейшее развитие

Для production-использования необходимо:

1. Интегрировать сертифицированную криптографическую библиотеку
2. Добавить обработку ошибок и валидацию сертификатов
3. Реализовать проверку цепочки доверия
4. Добавить поддержку различных форматов подписи (CAdES-BES, CAdES-T и т.д.)
5. Настроить CI/CD для автоматической сборки и тестирования

---

**Ссылки:**
- [Pilot-Web Documentation](https://help.pilotems.com/ru/)
- [Pilot-SDK](https://pilot.ascon.ru/beta/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/) — [официальная документация Webpack](https://webpack.js.org/guides/getting-started/)
- [RxJS Documentation](https://rxjs.dev/) — [руководство по операторам](https://rxjs.dev/guide/operators) и [API Reference](https://rxjs.dev/api)
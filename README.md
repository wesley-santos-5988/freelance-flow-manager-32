# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Gerar o APK (Capacitor + Android Studio)

O app funciona 100% offline (dados no `localStorage`), então ele é empacotado
como arquivos estáticos dentro de um WebView nativo.

Pré-requisitos: Node.js, JDK 17+, Android Studio (com SDK + Build Tools).

```sh
# 1. Instalar o Capacitor (só na primeira vez)
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli

# 2. Gerar o build web
npm run build

# 3. Criar o projeto Android nativo (só na primeira vez)
npx cap add android

# 4. Copiar o build para o projeto Android
npx cap sync

# 5. Abrir no Android Studio
npx cap open android
```

No Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
O `.apk` fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Edge-to-Edge (barras do sistema)

Use **Capacitor 8.3.2 ou superior** (`npm ls @capacitor/core` mostra a versão).
Para atualizar:

```sh
npm i @capacitor/core@latest @capacitor/android@latest
npm i -D @capacitor/cli@latest
npm run build
npx cap sync
```

Não é preciso mexer no `MainActivity` (não use `setDecorFitsSystemWindows`,
isso conflita com o tratamento nativo do Capacitor).

- O Capacitor injeta as variáveis `--safe-area-inset-top/bottom` no CSS
  (configurado em `capacitor.config.ts` → `plugins.SystemBars`). O app usa
  essas variáveis em `src/routes/index.tsx` para criar as margens superior e
  inferior, que ficam com a cor do background do tema.
- `SystemBars.style = "LIGHT"` deixa ícones da status bar e botões da barra de
  gestos **pretos**.

### Ícone do app

No Android Studio: clique com o botão direito em `app > res` >
**New > Image Asset**, escolha a logo e gere os ícones adaptativos.

### Atualizar o app depois de mudanças

Sempre que alterar o código web, rode novamente:

```sh
npm run build
npx cap sync
```

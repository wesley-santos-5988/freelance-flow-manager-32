import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do Capacitor para empacotar o Freela como APK nativo.
 *
 * Fluxo (após `npm run build`):
 *   npx cap add android   (só na primeira vez)
 *   npx cap sync
 *   npx cap open android
 */
const config: CapacitorConfig = {
  appId: "app.freela.manager",
  appName: "Freela",
  // Saída estática do build (nitro). O app é 100% offline (localStorage),
  // então o WebView serve esses arquivos sem nenhum servidor.
  webDir: ".output/public",
  server: {
    // Mantém o localStorage estável dentro do WebView, como no navegador.
    androidScheme: "https",
  },
};

export default config;

declare module 'i18n-jsautotranslate' {
  interface TranslateModule {
    changeLanguage(lang: string): void;
    language: {
      setLocal(lang: string): void;
    };
    service: {
      use(service: string): void;
    };
    listener: {
      start(): void;
    };
    execute(): void;
  }

  const translate: TranslateModule;
  export default translate;
}

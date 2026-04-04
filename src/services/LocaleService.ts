import { ref, Ref, watchEffect } from 'vue';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

type Locale = 'en' | 'fr';
type Translations = typeof en;

const LOCALE_STORAGE_KEY = 'app-locale';

class LocaleService {
    public locale: Ref<Locale>;
    private translations: Record<Locale, Translations> = { en, fr };

    constructor() {
        this.locale = ref(this.getInitialLocale());

        // Save lang on change
        watchEffect(() => {
            localStorage.setItem(LOCALE_STORAGE_KEY, this.locale.value);
        });
    }

    public t = (key: string): string => {
        const keys = key.split('.');
        let current: any = this.translations[this.locale.value];
        for (const k of keys) {
            if (current && current[k] !== undefined) {
                current = current[k];
            } else {
                return key;
            }
        }
        return current;
    }

    public setLocale = (newLocale: Locale) => {
        if (this.translations[newLocale]) {
            this.locale.value = newLocale;
        }
    }

    private getInitialLocale(): Locale {
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
        if (savedLocale && this.translations[savedLocale]) {
            return savedLocale;
        }

        const browserLang = navigator.language.split('-')[0] as Locale;
        if (this.translations[browserLang]) {
            return browserLang;
        }

        return 'fr';
    }
}

export const localeService = new LocaleService();

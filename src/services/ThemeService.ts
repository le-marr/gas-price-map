import { ref, watchEffect, Ref } from 'vue';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';

class ThemeService {
    public theme: Ref<Theme>;

    constructor() {
        this.theme = ref(this.getInitialTheme());

        watchEffect(() => {
            document.body.classList.remove('light', 'dark');
            document.body.classList.add(this.theme.value);
            localStorage.setItem(THEME_STORAGE_KEY, this.theme.value);
        });
    }

    public toggleTheme = () => {
        this.theme.value = this.theme.value === 'light' ? 'dark' : 'light';
    }

    private getInitialTheme(): Theme {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
        if (savedTheme) {
            return savedTheme;
        }

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }
}

export const themeService = new ThemeService();

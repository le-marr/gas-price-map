// --- Получаем все иконки из директории на этапе сборки ---
// { eager: true } заставляет Vite сразу загрузить модули, а не делать их ленивыми.
// Результат: объект вида { '/path/to/icon.png': 'processed-url.png' }
const iconModules = import.meta.glob('/src/assets/icons/*.png', { eager: true });

class IconService {
    private iconMap = new Map<string, string>();
    private defaultIcon: string;

    constructor() {
        for (const path in iconModules) {
            const url = (iconModules[path] as any).default;
            
            // extract brand /src/assets/icons/icon-brand-name.png -> brand-name
            const brandName = path
                .split('/')
                .pop()! // 'icon-brand-name.png'
                .replace('icon-', '') // 'brand-name.png'
                .replace('.png', ''); // 'brand-name'

            if (brandName === 'gas-default') {
                this.defaultIcon = url;
            } else {
                this.iconMap.set(brandName, url);
            }
        }
        if (!this.defaultIcon) {
            throw new Error("Default icon 'icon-gas-default.png' not found!");
        }
    }

    // normilize name: 'Pétro-Canada' -> 'petro-canada'
    private normalizeName(name: string): string {
        return name
            .toLowerCase()
            .normalize("NFD") // decompose accents
            .replace(/[\u0300-\u036f]/g, "") // rem accents/diacritics chars
            .replace(/\s+/g, '-') // spaces -> dash
            .replace(/[^a-z0-9-]/g, ''); // Keep only letters, numbers and dashes
    }

    // Return icon URL or default icon URL
    public getIcon(bannerName: string): string {
        if (!bannerName) {
            return this.defaultIcon;
        }
        const normalized = this.normalizeName(bannerName);
        return this.iconMap.get(normalized) || this.defaultIcon;
    }
}

export const iconService = new IconService();

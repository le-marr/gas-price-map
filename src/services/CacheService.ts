import { get, set } from 'idb-keyval';

// Cache expires in 10 minutes
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

interface CachedData<T> {
    timestamp: number;
    data: T;
}

class CacheService {
    /**
     * Retrieve data from cache or null if expired
     * @param key
     */
    public async get<T>(key: string): Promise<T | null> {
        const cached = await get<CachedData<T>>(key);
        if (!cached) {
            return null;
        }

        const isExpired = (new Date().getTime() - cached.timestamp) > CACHE_EXPIRATION_MS;
        if (isExpired) {
            console.log('Cache expired for key:', key);
            return null;
        }

        console.log('Cache hit for key:', key);
        return cached.data;
    }

    /**
     * Cache data with current timestamp
     * @param key
     * @param data
     */
    public async set<T>(key: string, data: T): Promise<void> {
        const item: CachedData<T> = {
            timestamp: new Date().getTime(),
            data,
        };
        await set(key, item);
        console.log('Cache set for key:', key);
    }
}

export const cacheService = new CacheService();

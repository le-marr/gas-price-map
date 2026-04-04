import pako from 'pako';
import { cacheService } from './CacheService';
import { FuelData, Station, FuelMetadata } from './DataService';
import localDataUrl from '../../data/stations.geojson.gz';

const CACHE_KEY = 'stations-data-local-json';

class LocalJsonDataService {
    public async getFuelData(): Promise<FuelData> {
        const cachedData = await cacheService.get<FuelData>(CACHE_KEY);
        if (cachedData) {
            return cachedData;
        }

        console.log('Fetching local GeoJSON data from:', localDataUrl);
        const response = await fetch(localDataUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch local GeoJSON: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        let geoJson;

        try {
            const decompressedData = pako.inflate(arrayBuffer);
            geoJson = JSON.parse(new TextDecoder('utf-8').decode(decompressedData));
            console.log('Successfully parsed as GZIP compressed GeoJSON.');
        } catch (e) {
            console.warn('Pako decompression failed, attempting to parse as plain text JSON.', e);
            geoJson = JSON.parse(new TextDecoder('utf-8').decode(arrayBuffer));
        }

        const fuelData = this.transformGeoJson(geoJson);
        await cacheService.set(CACHE_KEY, fuelData);
        return fuelData;
    }

    private parsePrice(priceStr: string | undefined): number | null {
        if (!priceStr || !priceStr.includes('\u00A2')) return null;
        return parseFloat(priceStr.replace('\u00A2', ''));
    }

    private transformGeoJson(geoJson: any): FuelData {
        const stations: Station[] = geoJson.features
            .map((feature: any) => {
                try {
                    if (!feature || !feature.properties || !feature.geometry || !feature.geometry.coordinates) {
                        throw new Error('Missing properties or geometry');
                    }
                    const prices: { [key: string]: number | null } = {
                        prixRegulier: null,
                        prixSuper: null,
                        prixDiesel: null,
                    };
                    if (feature.properties.Prices && Array.isArray(feature.properties.Prices)) {
                        for (const p of feature.properties.Prices) {
                            if (p.GasType === 'R\u00E9gulier') prices.prixRegulier = this.parsePrice(p.Price);
                            else if (p.GasType === 'Super') prices.prixSuper = this.parsePrice(p.Price);
                            else if (p.GasType === 'Diesel') prices.prixDiesel = this.parsePrice(p.Price);
                        }
                    }
                    return {
                        nom: feature.properties.Name,
                        banniere: feature.properties.brand,
                        adresse: feature.properties.Address,
                        region: feature.properties.Region,
                        codePostal: feature.properties.PostalCode,
                        latitude: feature.geometry.coordinates[1],
                        longitude: feature.geometry.coordinates[0],
                        ...prices,
                    };
                } catch (error: any) {
                    console.error(`Failed to process feature:`, feature, error);
                    return null;
                }
            })
            .filter((station): station is Station => station !== null);

        const metadata: FuelMetadata = {
            updatedAt: new Date(geoJson.metadata.generated_at).toLocaleString(),
            totalStations: geoJson.metadata.total_stations || null,
        };

        return { stations, metadata };
    }
}

export const localJsonDataService = new LocalJsonDataService();

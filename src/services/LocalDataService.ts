import * as XLSX from 'xlsx';
import { cacheService } from './CacheService';
import { FuelData, Station, FuelMetadata } from './DataService';

const CACHE_KEY = 'stations-data-local-excel';

class LocalDataService {
    public async getFuelData(): Promise<FuelData> {
        // This service is intended for development or local builds only.
        const useLocalData = import.meta.env.DEV || import.meta.env.VITE_USE_LOCAL_DATA === 'true';

        if (!useLocalData) {
            console.warn('LocalDataService is disabled. Returning empty data.');
            return {
                stations: [],
                metadata: { updatedAt: new Date().toLocaleString(), totalStations: 0 },
            };
        }

        const cachedData = await cacheService.get<FuelData>(CACHE_KEY);
        if (cachedData) {
            return cachedData;
        }

        // Dynamically import the local data file.
        const localDataUrl = (await import('../../data/stations-test.xlsx')).default;

        console.log('Fetching local Excel data from:', localDataUrl);
        const response = await fetch(localDataUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch local Excel: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const fuelData = this.parseExcelData(arrayBuffer);

        await cacheService.set(CACHE_KEY, fuelData);
        return fuelData;
    }

    private parseExcelData(arrayBuffer: ArrayBuffer): FuelData {
        console.log("parsing..")
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const emptyRowIndex = jsonData.findIndex(row => row.length === 0);
        const stationData = emptyRowIndex === -1 ? jsonData : jsonData.slice(1, emptyRowIndex);
        const metadataRows = emptyRowIndex === -1 ? [] : jsonData.slice(emptyRowIndex + 1);
        const metadataText = metadataRows.flat().join('\n');

        const stations: Station[] = stationData.map(row => ({
            nom: row[0],
            banniere: row[1],
            adresse: row[2],
            region: row[3],
            codePostal: row[4],
            latitude: parseFloat(row[5]),
            longitude: parseFloat(row[6]),
            prixRegulier: this.parsePrice(row[7]),
            prixSuper: this.parsePrice(row[8]),
            prixDiesel: this.parsePrice(row[9]),
        }));
        console.log("metadataText="+metadataText)
        let updatedAtMatch = metadataText.match(/Donn\u00E9es g\u00E9n\u00E9r\u00E9es le\s*:\s*(.*)/);
        if (!updatedAtMatch) {
            updatedAtMatch = metadataText.match(/Données générées le\s*:\s*(.*)/);
        }
        const totalStationsMatch = metadataText.match(/Total de stations\s*:\s*(\d+)/);

        const metadata: FuelMetadata = {
            updatedAt: updatedAtMatch ? updatedAtMatch[1].trim() : 'N/A',
            totalStations: totalStationsMatch ? parseInt(totalStationsMatch[1], 10) : null,
        };

        return { stations, metadata };
    }

    private parsePrice(price: string | number): number | null {
        if (typeof price === 'number') return price;
        if (typeof price !== 'string' || price === 'N/D' || !price.includes('¢')) return null;
        return parseFloat(price.replace('¢', ''));
    }
}

export const localDataService = new LocalDataService();

import * as XLSX from 'xlsx';
import { cacheService } from './CacheService';

const DATA_URL = 'https://regieessencequebec.ca/data/stations-20261230223355.xlsx';
const CACHE_KEY = 'stations-data';

export interface Station {
    nom: string;
    banniere: string;
    adresse: string;
    region: string;
    codePostal: string;
    latitude: number;
    longitude: number;
    prixRegulier: number | null;
    prixSuper: number | null;
    prixDiesel: number | null;
}

export interface FuelMetadata {
    updatedAt: string;
    totalStations: number | null;
}

export interface FuelData {
    stations: Station[];
    metadata: FuelMetadata;
}

class DataService {
    public async getFuelData(): Promise<FuelData> {
        const cachedData = await cacheService.get<FuelData>(CACHE_KEY);
        if (cachedData) {
            return cachedData;
        }

        console.log('Fetching fresh data from network...');
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const fuelData = this.parseExcelData(arrayBuffer);

        await cacheService.set(CACHE_KEY, fuelData);
        return fuelData;
    }

    private parseExcelData(arrayBuffer: ArrayBuffer): FuelData {
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

export const dataService = new DataService();

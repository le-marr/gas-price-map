import { jsonDataService } from './JsonDataService';
import { localJsonDataService } from './LocalJsonDataService';
import { dataService } from './DataService';
import { localDataService } from './LocalDataService';
import { FuelData } from './DataService';

interface IDataService {
    getFuelData(): Promise<FuelData>;
}

type DataSource = 'json' | 'excel';

class DataServiceFacade {
    /**
     * Returns the appropriate data service based on the flags.
     * @param source The desired data format ('json' or 'excel').
     */
    public getService(source: DataSource = 'json'): IDataService {
        const localMode = import.meta.env.VITE_USE_LOCAL_DATA === 'true'
        const devMode = import.meta.env.DEV;
        console.log("localMode="+localMode+" devMode="+devMode+" source="+source+ " useLocalData="+import.meta.env.VITE_USE_LOCAL_DATA)

        if (localMode) {
            if (source === 'json') {
                console.log('Using LocalJsonDataService');
                return localJsonDataService;
            } else {
                console.log('Using LocalDataService (Excel)');
                return localDataService;
            }
        } else {
            if (source === 'json') {
                console.log('Using JsonDataService');
                return jsonDataService;
            } else {
                console.log('Using DataService (Excel)');
                return dataService;
            }
        }
    }
}

export const dataServiceFacade = new DataServiceFacade();

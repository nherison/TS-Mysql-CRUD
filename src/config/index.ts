import * as path from 'path';
import { AppConfigOptions } from '../models';
import * as fs from 'fs-extra';

export const logDir = path.join(__dirname, '../../log');
fs.ensureDirSync(logDir);

class AppConfig {
    private configOptions: AppConfigOptions;

    get(): AppConfigOptions {

        if (this.configOptions === undefined) {
            const configFile = fs.readFileSync(path.join(__dirname, '../../config.json')).toString();
            const config = JSON.parse(configFile);

            const devFilePath = path.join(__dirname, '../../config.dev.json');

            let devConfig = {};
            if (process.env.NODE_ENV === 'dev' && fs.existsSync(devFilePath)) {
                devConfig = JSON.parse(fs.readFileSync(devFilePath).toString());
            }
            const debugDefault = {
				bookies:[],
				db: {
					dbHost: 'localhost',
					dbUser: "test",
					dbPwd: "test",
					dbName: "test"
				}
			};
			
            this.configOptions = {
                ...debugDefault,
                ...config,
                ...devConfig
			};
        }
        return this.configOptions;
    }
}

export default new AppConfig();
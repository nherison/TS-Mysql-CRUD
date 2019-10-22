import * as mysql from 'mysql2';
import * as path from 'path';
import * as moment from 'moment';
import { EventEmitter } from 'events';
import AppConfig, {logDir} from './config';
import { AppConfigOptions, TeamName } from './models';
import * as logger from './core/logger';
import { resolve } from 'bluebird';

type Connection = mysql.Connection;

class MysqlWrapper extends EventEmitter {
	private connection:Connection;
	private date:string;

	constructor(){
		super();
		const config:AppConfigOptions = AppConfig.get();

		this.connection = mysql.createConnection({
			host     : config.db.dbHost,
			user     : config.db.dbUser,
			password : config.db.dbPwd,
			database : config.db.dbName
		});
		this.connection.connect();
	}

	init = (bookies:string[], logDate:string) => {
		// Create Talbe if not existed 'teamnames'.
		this.date = logDate;
		const queryStr = 
			`CREATE TABLE IF NOT EXISTS teamnames (
				id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				sport VARCHAR(255) NOT NULL,
				base VARCHAR(255) NOT NULL,
				${bookies.map(bookie => `${bookie} VARCHAR(255) NULL`)}
				${bookies.length === 0 ? '' : ','}
				createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updatedAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			)`
		
		return new Promise(async (resolve, reject) => {
			this.connection.query(queryStr, async (err, results) => {
				if(err)	reject(err);

				// Check if there is not existed bookie column if not add.
				await Promise.all(
					bookies.map(async (bookie:string) => await this.addBookieColIfNotExist(bookie))
				)
				console.log('init finished!')
				resolve();
			});
		})
	}

	addBookieColIfNotExist = (bookie) => {
		return new Promise((resolve, reject) => {
			this.connection.query(`SHOW COLUMNS FROM \`teamnames\` LIKE '${bookie}'`, (err, result) => {
				if (err) reject(err);
				if (result.length === 0) {
					// Bookie Column not existed. Add bookie column
					this.connection.query(`ALTER TABLE teamnames add column (${bookie} varchar(255))`, (error, result) => {
						if(error) reject(error);
						this.writeDbLog(`New Bookie Added: ${bookie}\n`);
						console.log('New bookie added:', bookie);
						resolve();
					});
				} else {
					resolve();
				}
			})
		})
	}
	
	getTeamNames() {
		return new Promise((resolve, reject) => {
			this.connection.query('SELECT * FROM teamnames', (err, results) => {
				if(err)	reject(err);
				resolve(results);
			});
		})
	}

	updateIfExisted = async(teamName: TeamName):Promise<boolean> => {
		const {sport, base} = teamName;
		
		return new Promise((resolve, reject) => {
			this.connection.query(`SELECT * FROM teamnames WHERE sport = \'${sport}\' AND base = \'${base}\'`, (err, result) => {
				if (err)	reject(err);
				if (result.length) {
					const existedTeamName = result[0];
					const newTeamName = {...existedTeamName, ...teamName};
					this.connection.query(`UPDATE teamnames SET ? WHERE sport = \'${sport}\' AND base = \'${base}\'`, newTeamName, (error, result) => {
						if (error) reject(error);
						this.writeDbLog('Updated: ' + JSON.stringify(existedTeamName) + '\n-------> ' + JSON.stringify(newTeamName) + '\n');
						resolve(true);
					});
					
				}
				else	resolve(false);
			});
		});
	}

	addOrUpdate = async (teamName: TeamName):Promise<number> => {
		try{
			const isExist:number = await this.updateIfExisted(teamName) ? 1 : 0;
			if (isExist === 0) {
				//If not existed add new row
	
				const query = `INSERT INTO teamnames SET ?`;
				
				this.connection.query(query, teamName, (err, result) => {
					if (err) throw err;
					this.writeDbLog('Inserted: ' + JSON.stringify(teamName) + '\n');
				});
			} else {
				console.log('existed and updated');
			}

			return new Promise((resolve, reject) => {
				resolve(isExist);
			});
		} catch(err) {
			throw err;
		}
	}

	writeDbLog = async (data: string) => {
		logger.write(path.join(logDir, `./${this.date}-db.log`), data)
	}

	end() {
		this.connection.end();
	}
	
}

export default new MysqlWrapper;
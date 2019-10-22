import * as moment from 'moment';
import mysql from './mysql';
import * as logger from './core/logger';
import { TeamName } from './models';
import AppConfig from './config';
import { readCSVFile } from './utils';


const main = async () => {
	try{
		const { mockup } = AppConfig.get();
		let bookies:string[] = [];
		let teamNames:TeamName[]|undefined = [];
		let updatedCount:number = 0;

		if (mockup) {
			bookies = mockup.bookies;
			teamNames = mockup.teamNames;
		} else {
			teamNames = await readCSVFile('./teamnames.csv');
			if (teamNames.length === 0)	throw 'no names at file.';

			bookies = Object.keys(teamNames[0]).filter(key => key != 'sport' && key != 'base');
		}

		await mysql.init(bookies, moment().utc().format('YYYY-MM-DD'));
				
		if(teamNames) {
			for (const teamName of teamNames) {
				updatedCount += await mysql.addOrUpdate(teamName);
			}
			console.log(`Inserted: ${teamNames.length - updatedCount}\nUpdated: ${updatedCount}`)

		}
		
		mysql.end();
	}catch(err){
		console.log(err);
	}
}

main();

process.on('exit', () => {
    logger.closeAll();
});
import * as fs from 'fs';
import * as csv from 'fast-csv';
import { TeamName } from './models';

export const readCSVFile = (filePath: string):Promise<TeamName[]>=> {
	return new Promise<TeamName[]>((resolve, reject) => {
		const result:TeamName[] = [];
		fs.createReadStream(filePath)
			.pipe(csv.parse({ headers: true }))
			.on('data', row => result.push(row))
			.on('end', () => resolve(result))
			.on('error', (error) => reject(error))
	});
}
import rfs from 'rotating-file-stream';
import { WriteStream } from 'fs';
import * as path from 'path';
const loggerList = new Map<string, WriteStream>();

export const create = (filepath: string) => {
	console.log('create')
    let logger = loggerList.get(filepath);
    if (!logger) {
        const baseDir = path.dirname(filepath);
        const filename = path.basename(filepath);
        logger = rfs(filename, {
            size: "50M", // rotate every 10 MegaBytes written
            interval: "1d", // rotate daily
            path: baseDir
        });
        loggerList.set(filepath, logger);
    }
}
//using stream to write is faster than appendFile
export const write = (filename: string, data: string) => {

    if (!loggerList.has(filename)) {
        create(filename);
    }
    const logger = loggerList.get(filename)!;
    logger.write(data, (error) => error && console.error(error));
}
export const remove = (fileName: string) => {
    const logger = loggerList.get(fileName);
    if (logger) {
        logger.end();
        loggerList.delete(fileName);
    }
}
export const closeAll = () => {
    for (const [, v] of loggerList) {
        v.end();
    }
    loggerList.clear();
}
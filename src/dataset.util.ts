import { config } from "dotenv";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

config();
export const datasetDir = join(process.cwd(), 'dataset');
export const files = readdirSync(datasetDir);

export function useReadDataset<T>(fn: (s: string) => T) {
    return (fileName: string) => {
        const content = readFileSync(join(datasetDir, fileName)).toString('utf-8');
        const fnSplit = fileName.split('/')
        return {
            fileName: fnSplit[fnSplit.length - 1],
            content: fn(content),
        };    
    }
}

export function sum(a: number, b: number) {
    return a + b;
}

export function sample<T>(transformFeature: (s: string) => T) {
    const [,,requestedFileName] = process.argv
    const fileReaderMapper = useReadDataset(transformFeature)
    const samples = files.map(fileReaderMapper);
    if (requestedFileName) {
        return [fileReaderMapper(join('..', requestedFileName)), samples.filter(e => !requestedFileName.includes(e.fileName))] as const;    
    } else {
        return [samples.splice(~~(Math.random() * samples.length), 1)[0], samples] as const;
    }
}

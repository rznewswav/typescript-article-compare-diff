import { config } from "dotenv";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

config();
export const datasetDir = join(process.cwd(), 'dataset');
export const files = readdirSync(datasetDir);

export function useReadDataset<T>(fn: (s: string) => T) {
    return (fileName: string) => {
        const content = readFileSync(join(datasetDir, fileName)).toString('utf-8');
        return {
            fileName,
            content: fn(content),
        };    
    }
}

export function sum(a: number, b: number) {
    return a + b;
}

export function sample<T>(transformFeature: (s: string) => T) {
    const samples = files.map(useReadDataset(transformFeature));
    return [samples.splice(~~(Math.random() * samples.length), 1)[0], samples] as const;
}
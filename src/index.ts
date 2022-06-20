import { config } from "dotenv";
import diff from "fast-diff";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

config()

const datasetDir = join(process.cwd(), 'dataset')
const files = readdirSync(datasetDir)

function transformFeature(article: string) {
    return article.split(/\s/gi).map(e => e.trim().toLocaleLowerCase('en-gb')).filter(e => e.length).join('\n')
}

function readDataset(fileName: string) {
    const content = readFileSync(join(datasetDir, fileName)).toString('utf-8')
    return {
        fileName,
        content: transformFeature(content),
    }
}

function sample() {
    const samples = files.map(readDataset)
    return [samples.splice(~~(Math.random() * samples.length), 1)[0], samples] as const
}

const [testFile, testPool] = sample()

function sum(a: number, b: number) {
    return a + b;
}

function computeDiffFactor(string1: ReturnType<typeof transformFeature>, string2: ReturnType<typeof transformFeature>) {
    return diff(string1, string2).filter(e => e[0] === diff.DELETE).map(([,score]) => Math.abs(score.length)).map(Number).reduce(sum) / Math.min(string1.length, string2.length)
}

function computeDatasetSimilarity(source: ReturnType<typeof readDataset>, datasetPool: Array<ReturnType<typeof readDataset>>) {
    return datasetPool.map(({fileName, content}) => ({
        diffFactor: computeDiffFactor(source.content, content),
        fileName,
    }))
}

console.log(testFile.fileName, computeDatasetSimilarity(testFile, testPool).sort((a, b) => a.diffFactor - b.diffFactor))
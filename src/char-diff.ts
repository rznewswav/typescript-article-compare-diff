import diff from "fast-diff";
import { sample, sum } from "./dataset.util";

const startNow = performance.now();
export function transformFeature(article: string) {
    return article.split(/\s/gi).map(e => e.trim().toLocaleLowerCase('en-gb')).filter(e => e.length).join('\n');
}

export const [testFile, testPool] = sample(transformFeature);

function computeDiffFactor(string1: ReturnType<typeof transformFeature>, string2: ReturnType<typeof transformFeature>) {
    return diff(string1, string2).filter(e => e[0] === diff.DELETE).map(([,chars]) => Math.abs(chars.length)).map(Number).reduce(sum, 0) / string1.length
}

function computeDatasetSimilarity(source: typeof testFile, datasetPool: typeof testPool) {
    return datasetPool.map(({fileName, content}) => ({
        diffFactor: computeDiffFactor(source.content, content),
        fileName,
    }))
}

console.log(testFile.fileName, computeDatasetSimilarity(testFile, testPool).sort((a, b) => a.diffFactor - b.diffFactor))
const endNow = performance.now()

console.log(`Time taken: ${endNow - startNow}ms`)

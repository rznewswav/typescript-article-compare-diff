import worddiff from 'word-diff';
import { sample, sum } from "./dataset.util";

function transformFeature(content: string) {
    return content.split(/\s/g).map(e => e.trim().toLocaleLowerCase('en-gb')).join(' ');
}

function diff(str1: string, str2: string) {
    const wdiff = worddiff.diffString(str1, str2)
    return wdiff.map(d => {
        if ('remove' in d && 'add' in d) {
            const { remove = '', add = '' } = d
            return (remove.trim().split(' ').length + add.trim().split(' ').length) / 2
        } else {
            return 0;
        }
    }).reduce(sum, 0)
}

export const [testFile, testPool] = sample(transformFeature);

function computeDiffFactor(string1: ReturnType<typeof transformFeature>, string2: ReturnType<typeof transformFeature>) {
    return Math.min(1, diff(string1, string2) / string1.split(/\s/g).length)
}

function computeDatasetSimilarity(source: typeof testFile, datasetPool: typeof testPool) {
    return datasetPool.map(({fileName, content}) => ({
        diffFactor: computeDiffFactor(source.content, content),
        fileName,
    }))
}

console.log(testFile.fileName, computeDatasetSimilarity(testFile, testPool).sort((a, b) => a.diffFactor - b.diffFactor))
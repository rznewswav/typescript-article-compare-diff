import worddiff from 'word-diff';
import { sample, sum } from "./dataset.util";

const startNow = performance.now();
function transformFeature(content: string) {
    const [headline, url, ...article] = content.split(/\n/g)
    const [lang, ...title] = headline.split('-')
    return [
        lang.trim(),
        title.join('-').trim(),
        url,
        article.map(e => e.split(/\W/gmi).map(e => e.trim()).filter(e => e.length).join(' ').trim().toLocaleLowerCase('en-gb')).join(' ')
    ] as const;
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

function computeDiffFactor(string1: ReturnType<typeof transformFeature>[3], string2: ReturnType<typeof transformFeature>[3]) {
    return Math.min(1, diff(string1, string2) / string1.split(/\s/g).length)
}

function computeDatasetSimilarity(source: typeof testFile, datasetPool: typeof testPool) {
    return datasetPool.map(({fileName, content: [lang, title, url, content]}) => ({
        diffFactor: computeDiffFactor(source.content[3], content),
        fileName,
        lang, title, url
    }))
}

console.log(testFile.fileName, computeDatasetSimilarity(testFile, testPool).sort((a, b) => a.diffFactor - b.diffFactor))
const endNow = performance.now()

console.log(`Time taken: ${endNow - startNow}ms`)

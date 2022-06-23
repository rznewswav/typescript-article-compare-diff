import worddiff from 'word-diff';
import { sample, sum } from "./dataset.util";
import Papa from 'papaparse';

const nonAlphaNumericRegex = /[^a-z0-9]/gmi;
const startNow = performance.now();
function transformFeature(content: string) {
    const [headline, url, ...article] = content.split(/\n/g)
    const [lang, ...title] = headline.toLocaleLowerCase('en-gb').split('-').map(e => e.trim()).filter(e => e.length)
    const cleanTextArray = article.map(e => {
        const tokenized = e.split(nonAlphaNumericRegex)
        return [tokenized.join(' '), tokenized.length] as const;
    })
    return [
        lang.trim(),
        title.join('-').trim(),
        url,
        cleanTextArray.map(([e]) => e).join(' '),
        cleanTextArray.map(([,e]) => e).reduce(sum, 0),
    ] as const;
}

function diff(str1: string, str2: string, tokenSize1: number, tokenSize2: number) {
    const wdiff = worddiff.diffString(str1, str2)
    return wdiff.map(d => {
        if ('remove' in d && 'add' in d) {
            const { remove = '', add = '' } = d
            return remove.trim().split(' ').length / tokenSize1 + add.trim().split(' ').length / tokenSize2
        } else {
            return 0;
        }
    }).reduce(sum, 0)
}

export const [testFile, testPool] = sample(transformFeature);

function computeDiffFactor([, , , string1, strlen1]: ReturnType<typeof transformFeature>, [, , , string2, strlen2]: ReturnType<typeof transformFeature>) {
    return 1 - diff(string1, string2, strlen1, strlen2) / 2
}

function computeDatasetSimilarity(source: typeof testFile, datasetPool: typeof testPool) {
    return [
        {
            similarity: 100,
            // titleDiffFactor: 0,
            fileName: source.fileName,
            lang: source.content[0],
            title: source.content[1],
            url: source.content[2],
            source: source.fileName,
        },
        ...datasetPool.map(({ fileName, content: targetContent }) => {
            const [lang, title, url] = targetContent
            return ({
                similarity: Math.round(computeDiffFactor(source.content, targetContent) * 10000) / 100,
                // titleDiffFactor: computeDiffFactor(source.content[1], title),
                fileName,
                lang, title, url,
                source: source.fileName,
            });
        }),
    ]
}
const computation = computeDatasetSimilarity(testFile, testPool).sort((a, b) => b.similarity - a.similarity)
const endNow = performance.now()
const timeTaken = endNow - startNow
const columns = [
    'timeTaken',
    ...Object.keys(computation[0]),
]

Object.assign(computation[0], {
    timeTaken
})

console.log(Papa.unparse(computation, {
    columns
}))


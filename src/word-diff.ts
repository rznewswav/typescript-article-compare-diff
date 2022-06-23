import worddiff from 'word-diff';
import { sample, sum } from "./dataset.util";
import Papa from 'papaparse';

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
            return remove.trim().split(' ').length / str1.split(/\s/g).length + add.trim().split(' ').length / str2.split(/\s/g).length
        } else {
            return 0;
        }
    }).reduce(sum, 0)
}

export const [testFile, testPool] = sample(transformFeature);

function computeDiffFactor(string1: ReturnType<typeof transformFeature>[3], string2: ReturnType<typeof transformFeature>[3]) {
    return diff(string1, string2) / 2
}

function computeDatasetSimilarity(source: typeof testFile, datasetPool: typeof testPool) {
    return [
        {
            contentDiffFactor: 0,
            titleDiffFactor: 0,
            fileName: source.fileName,
            lang: source.content[0],
            title: source.content[1],
            url: source.content[2],
            source: source.fileName,
        },
        ...datasetPool.map(({fileName, content: [lang, title, url, content]}) => ({
            contentDiffFactor: computeDiffFactor(source.content[3], content),
            titleDiffFactor: computeDiffFactor(source.content[1], title),
            fileName,
            lang, title, url,
            source: source.fileName,
        })),
    ]
}
const computation = computeDatasetSimilarity(testFile, testPool).sort((a, b) => a.contentDiffFactor - b.contentDiffFactor)
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


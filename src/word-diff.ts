import worddiff from "word-diff";
import { sample, sum } from "./dataset.util";
import {
  sample as prodSample,
  useProdSample,
  Transformer,
} from "./prod-dataset.util";
import Papa from "papaparse";
import punycode from "punycode";

export const wordRegex = /(\p{Script=Han})|(\w+)|(\d+)/giu;

export const lineTransformer = (e: string): string[] => {
  return (
    e.toLocaleLowerCase("en-gb").match(wordRegex)?.map(punycode.encode) ?? []
  );
};

const startNow = performance.now();
function transformFeature(content: string) {
  const [headline, url, ...article] = content.split(/\n/g);
  const [lang, ...title] = headline.split("-");
  const cleanTextArray = article
    .map((e) => e.trim())
    .filter((e) => e.length)
    .map((e) => {
      const tokenized = lineTransformer(e);
      return [tokenized.join(" "), tokenized.length] as const;
    });
  return [
    lang.trim(),
    title.join("-").trim(),
    url,
    cleanTextArray.map(([e]) => e).join(" "),
    cleanTextArray.map(([, e]) => e).reduce(sum, 0),
  ] as const;
}

export const transformProdFeature: Transformer<
  ReturnType<typeof transformFeature>
> = ({ uniqueId, title, html, ...others }) => {
  const cleanTextArray = html
    .split(/\n/g)
    .map((e) => e.trim())
    .filter((e) => e.length)
    .map((e) => {
      const tokenized = lineTransformer(e);
      return [tokenized.join(" "), tokenized.length] as const;
    });
  return [
    "en",
    title,
    `https://newswav.com/${uniqueId}`,
    cleanTextArray.map(([e]) => e).join(" "),
    cleanTextArray.map(([, e]) => e).reduce(sum, 0),
  ] as const;
};

function diff(
  str1: string,
  str2: string,
  tokenSize1: number,
  tokenSize2: number
) {
  const wdiff = worddiff.diffString(str1, str2);
  return wdiff
    .map((d) => {
      if ("remove" in d && "add" in d) {
        const { remove = "", add = "" } = d;
        return (
          remove.trim().split(" ").length / tokenSize1 +
          add.trim().split(" ").length / tokenSize2
        );
      } else {
        return 0;
      }
    })
    .reduce(sum, 0);
}

export const [testFile, testPool] = useProdSample
  ? prodSample(transformProdFeature)
  : sample(transformFeature);

function computeDiffFactor(
  [, , , string1, strlen1]: ReturnType<typeof transformFeature>,
  [, , , string2, strlen2]: ReturnType<typeof transformFeature>
) {
  return 1 - diff(string1, string2, strlen1, strlen2) / 2;
}

async function diffAsync(
  str1: string,
  str2: string,
  tokenSize1: number,
  tokenSize2: number
) {
  const wdiff = worddiff.diffString(str1, str2);
  return await Promise.all(
    wdiff.map(async (d) => {
      if ("remove" in d && "add" in d) {
        const { remove = "", add = "" } = d;
        return (
          remove.trim().split(" ").length / tokenSize1 +
          add.trim().split(" ").length / tokenSize2
        );
      } else {
        return 0;
      }
    })
  ).then((e) => e.reduce(sum, 0));
}

async function computeDiffFactorAsync(
  [, , , string1, strlen1]: ReturnType<typeof transformFeature>,
  [, , , string2, strlen2]: ReturnType<typeof transformFeature>
) {
  return 1 - (await diffAsync(string1, string2, strlen1, strlen2)) / 2;
}

export function computeDatasetSimilarity(
  source: typeof testFile,
  datasetPool: typeof testPool
) {
  return [
    {
      similarity: 100,
      source: source.fileName,
      target: source.fileName,
      title: source.content[1],
      lang: source.content[0],
      url: source.content[2],
      similarityLog10: 100,
    },
    ...datasetPool.map(({ fileName, content: targetContent }) => {
      const [lang, title, url] = targetContent;
      const similarity =
        Math.round(computeDiffFactor(source.content, targetContent) * 10000) /
        100;
      const similarityLog10 =
        Math.round((similarity < 1 ? 0 : Math.log10(similarity) / 2) * 10000) /
        100;
      return {
        similarity,
        similarityLog10,
        source: source.fileName,
        target: fileName,
        lang,
        title,
        url,
      };
    }),
  ];
}

export async function computeDatasetSimilarityAsync(
  source: typeof testFile,
  datasetPool: typeof testPool
) {
  return [
    {
      similarity: 100,
      source: source.fileName,
      target: source.fileName,
      title: source.content[1],
      lang: source.content[0],
      url: source.content[2],
      similarityLog10: 100,
    },
    ...(await Promise.all(
      datasetPool.map(async ({ fileName, content: targetContent }) => {
        const [lang, title, url] = targetContent;
        const similarity =
          Math.round(
            (await computeDiffFactorAsync(source.content, targetContent)) *
              10000
          ) / 100;
        const similarityLog10 =
          Math.round(
            (similarity < 1 ? 0 : Math.log10(similarity) / 2) * 10000
          ) / 100;
        return {
          similarity,
          similarityLog10,
          source: source.fileName,
          target: fileName,
          lang,
          title,
          url,
        };
      })
    )),
  ];
}

if (require.main === module) {
  const computation = computeDatasetSimilarity(testFile, testPool).sort(
    (a, b) => b.similarity - a.similarity
  );
  const endNow = performance.now();
  const timeTaken = endNow - startNow;
  const columns = ["timeTaken", ...Object.keys(computation[0])];

  Object.assign(computation[0], {
    timeTaken,
  });

  console.log(
    Papa.unparse(computation, {
      columns,
    })
  );
}

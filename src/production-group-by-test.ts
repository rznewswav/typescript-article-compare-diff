import { sample as prodSample, useProdSample } from "./prod-dataset.util";
import {
  computeDatasetSimilarityAsync,
  lineTransformer,
  transformProdFeature,
} from "./word-diff";
import yaml from "yaml";
import { readFileSync } from "fs";
import { join } from "path";
import { sum } from "./dataset.util";
import Papa from "papaparse";

if (!useProdSample) {
  throw new Error("Can only run using production sample.");
}

const [_testFile, testPool] = prodSample(transformProdFeature);
testPool.push(_testFile);

type TestYaml = {
  title: string;
  content: string;
  url: string;
  nwId: string;
};
const testYaml: TestYaml[] = yaml.parse(
  readFileSync(
    join(process.cwd(), "prod-dataset/0627-0627-test.yaml")
  ).toString("utf8")
).data;

const testFiles: typeof _testFile[] = testYaml.map((e) => {
  const cleanTextArray = e.content
    .split(/\n/g)
    .map((e) => e.trim())
    .filter((e) => e.length)
    .map((e) => {
      const tokenized = lineTransformer(e);
      return [tokenized.join(" "), tokenized.length] as const;
    });
  return {
    fileName: e.nwId,
    content: [
      "en",
      e.title,
      `https://newswav.com/${e.nwId}`,
      cleanTextArray.map(([e]) => e).join(" "),
      cleanTextArray.map(([, e]) => e).reduce(sum, 0),
    ] as const,
  };
});

async function start() {
  const start = performance.now();
  const testResult = await Promise.all(
    testFiles.map(async (testFile) => {
      const start = performance.now();
      const similarity = await computeDatasetSimilarityAsync(testFile, testPool)
        .then((e) =>
          e.filter(
            ({ similarity, target }) =>
              similarity > 60 && target !== testFile.fileName
          )
        )
        .then((e) => e.sort((a, b) => b.similarity - a.similarity));
      const end = performance.now();
      return {
        similarity: similarity,
        source: testFile,
        timeTaken: end - start,
      };
    })
  );
  const end = performance.now();

  const totalTimeTaken = end - start;

  const csvBody = testResult.map(
    ({ similarity, source: { fileName: articleId }, ...others }) => ({
      ...others,
      articleId,
      ...similarity.reduce((a, b, index) => {
        a[`Top ${index + 1} match`] = `${b.target} - ${b.title}`;
        return a;
      }, {} as Record<string, any>),
    })
  );

  const columns = csvBody.reduce((a, b) => {
    const keys = Object.keys(b);
    return keys.length > a.length ? keys : a;
  }, new Array<string>());

  console.log(
    Papa.unparse(
      [
        {
          [columns[0]]: totalTimeTaken,
        },
        ...csvBody,
      ],
      {
        columns,
      }
    )
  );
}

start();

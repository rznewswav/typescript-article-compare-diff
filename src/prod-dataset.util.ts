import { config } from "dotenv";
import { join } from "path";

config();

export type ProdSchema = {
  uniqueId: string;
  title: string;
  publishedDate: string;
  html: string;
};

export type Transformer<T> = (i: ProdSchema) => T;

export function useReadDataset<T>(fn: Transformer<T>) {
  return (instance: ProdSchema) => {
    return {
      fileName: instance.uniqueId,
      content: fn(instance),
    };
  };
}

export function sum(a: number, b: number) {
  return a + b;
}

function getProdDatasetPath() {
  const prodDSPath = process.env.PROD_DATASET;
  if (typeof prodDSPath !== "string")
    throw new Error(
      "Production dataset path is not set in the environment variable!"
    );
  return join(process.cwd(), prodDSPath);
}

export function sample<T>(transformFeature: Transformer<T>) {
  const [, , requestedUniqueId] = process.argv;
  const fileReaderMapper = useReadDataset(transformFeature);
  const files: ProdSchema[] = require(getProdDatasetPath());
  const samples = files.map(fileReaderMapper);
  if (requestedUniqueId) {
    const matchedSample = samples.find((e) => e.fileName === requestedUniqueId);
    if (!matchedSample)
      throw new Error(
        "Cannot find sample with unique id: " + requestedUniqueId
      );
    return [
      matchedSample,
      samples.filter((e) => e.fileName !== requestedUniqueId),
    ] as const;
  } else {
    return [
      samples.splice(~~(Math.random() * samples.length), 1)[0],
      samples,
    ] as const;
  }
}

export const useProdSample = process.env.USE_PROD_DATASET == "true";

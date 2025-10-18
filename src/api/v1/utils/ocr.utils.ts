import { createWorker } from "tesseract.js";

export const recognize = async (filePath: string) => {
  const worker = await createWorker("eng");
  const {
    data: { text },
  } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
};

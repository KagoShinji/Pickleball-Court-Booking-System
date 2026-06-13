const { createWorker } = require('tesseract.js');
const path = require('path');

const img1 = 'C:\\Users\\RYZEN 7\\.gemini\\antigravity\\brain\\716a1029-a5cb-45b2-bc8d-a4bbe0862b08\\media__1780898623803.png';
const img2 = 'C:\\Users\\RYZEN 7\\.gemini\\antigravity\\brain\\716a1029-a5cb-45b2-bc8d-a4bbe0862b08\\media__1780898629899.png';

async function runOCR(imagePath) {
  console.log(`\n--- Running OCR on: ${path.basename(imagePath)} ---`);
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  console.log("Extracted Text:\n", ret.data.text);
  await worker.terminate();
}

async function main() {
  try {
    await runOCR(img1);
  } catch (err) {
    console.error("Error OCR img1:", err);
  }
  try {
    await runOCR(img2);
  } catch (err) {
    console.error("Error OCR img2:", err);
  }
}

main();

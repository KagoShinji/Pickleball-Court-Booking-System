/**
 * Regular expression parser for Philippine e-wallets (GCash and Maya).
 * Extracts reference number and amount paid from raw OCR text blocks.
 */

/**
 * Parses raw text extracted by Tesseract OCR.
 * 
 * @param {string} rawText The raw string block from the OCR engine.
 * @returns {Object} JSON payload: { extractedAmount: number | null, extractedRefNo: string | null, rawText: string }
 */
export function parseReceiptText(rawText) {
  if (!rawText) {
    return { extractedAmount: null, extractedRefNo: null, rawText: '' };
  }

  // Replace multiple whitespaces and newlines with a single space to make regex matching easier
  const normalizedText = rawText.replace(/\s+/g, ' ');

  // 1. Reference Number Extraction
  // GCash & Maya reference numbers are exactly 13 digits.
  // ShopeePay reference numbers are 19 digits.
  // Instapay / other e-wallet reference numbers can be 6 to 30 digits.
  const refNoRegexes = [
    // Look for identifier followed by separator and 6 to 30 digits
    /(?:ref\s*id|reference\s*id|transaction\s*sn|ref\s*no|reference\s*no\.?|instapay\s*ref|transaction\s*no\.?|ref\.?\s*no\.?|reference|ref|trans\s*no)\s*[:#-]?\s*(\d{6,30})\b/i,
    // Look for any isolated 13 digit (GCash/Maya) or 19 digit (ShopeePay) number if we didn't match the identifier (fallback)
    /\b(\d{13}|\d{19})\b/
  ];

  let extractedRefNo = null;
  for (const regex of refNoRegexes) {
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      extractedRefNo = match[1];
      break;
    }
  }

  // 2. Amount Paid Extraction
  // Match headers like Amount, Amount Paid, PHP, P, or ₱.
  // The amount value can have commas and a decimal point.
  const amountRegexes = [
    /(?:amount\s*paid|amount)\s*[:#-]?\s*(?:php|p|₱)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/i,
    /(?:php|p|₱)\s*[:#-]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/i
  ];

  let extractedAmount = null;
  for (const regex of amountRegexes) {
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      // Clean out commas and currency symbols, then parse as float
      const cleaned = match[1].replace(/,/g, '');
      const parsedVal = parseFloat(cleaned);
      if (!isNaN(parsedVal)) {
        extractedAmount = parsedVal;
        break;
      }
    }
  }

  return {
    extractedAmount,
    extractedRefNo,
    rawText
  };
}

/**
 * OCR service using Google Cloud Vision API.
 * Converts receipt images to structured expense data.
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { ExtractedReceipt } from '../types';
import { parseReceiptText, calculateConfidence } from '../utils/receiptParser';
import { mapReceiptToExpenseType } from '../utils/categoryMapper';
import { getTodayISO } from '../utils/dateParser';

const VISION_API_URL =
  'https://vision.googleapis.com/v1/images:annotate';

interface VisionAnnotateResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      confidence?: number;
    }>;
    fullTextAnnotation?: {
      text: string;
      pages?: Array<{
        confidence?: number;
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

/**
 * Reads an image file and returns base64-encoded content.
 */
async function imageToBase64(imageUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Calls Google Cloud Vision API with the receipt image.
 * Returns raw OCR text and a confidence score (0-100).
 */
async function callVisionAPI(
  imageBase64: string,
  apiKey: string,
): Promise<{ text: string; confidence: number }> {
  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ['en'],
        },
      },
    ],
  };

  const response = await axios.post<VisionAnnotateResponse>(
    `${VISION_API_URL}?key=${apiKey}`,
    requestBody,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    },
  );

  const result = response.data.responses[0];

  if (result.error) {
    throw new Error(`Vision API error: ${result.error.message}`);
  }

  const text =
    result.fullTextAnnotation?.text ||
    result.textAnnotations?.[0]?.description ||
    '';

  // Estimate confidence from page-level confidence if available
  const pageConfidence = result.fullTextAnnotation?.pages?.[0]?.confidence;
  const confidence = pageConfidence != null ? Math.round(pageConfidence * 100) : 75;

  return { text, confidence };
}

/**
 * Processes a receipt image and returns extracted expense data.
 * @param imageUri Local URI of the captured/selected image
 * @param apiKey Google Cloud Vision API key
 */
export async function processReceiptImage(
  imageUri: string,
  apiKey: string,
): Promise<ExtractedReceipt> {
  // Convert image to base64
  const imageBase64 = await imageToBase64(imageUri);

  // Call OCR API
  const { text, confidence: apiConfidence } = await callVisionAPI(
    imageBase64,
    apiKey,
  );

  if (!text || text.trim().length === 0) {
    throw new Error(
      'No text detected in image. Please ensure the receipt is clearly visible and well-lit.',
    );
  }

  // Parse extracted text into structured data
  const parsed = parseReceiptText(text);
  const structuredConfidence = calculateConfidence(parsed);

  // Blend API confidence with structural confidence
  const finalConfidence = Math.round(
    apiConfidence * 0.5 + structuredConfidence * 0.5,
  );

  const category = mapReceiptToExpenseType(text, parsed.vendor);

  return {
    vendor: parsed.vendor,
    date: parsed.date || getTodayISO(),
    totalAmount: parsed.totalAmount,
    items: parsed.items,
    category,
    rawText: text,
    confidence: finalConfidence,
    imageUri,
  };
}

/**
 * Performs a quick validation of extracted receipt data.
 * Returns an array of field names that are missing or invalid.
 */
export function validateExtractedReceipt(
  receipt: ExtractedReceipt,
): string[] {
  const missing: string[] = [];

  if (!receipt.vendor || receipt.vendor === 'Unknown Vendor') {
    missing.push('vendor');
  }
  if (!receipt.date) {
    missing.push('date');
  }
  if (!receipt.totalAmount || receipt.totalAmount <= 0) {
    missing.push('totalAmount');
  }
  if (!receipt.items || receipt.items.length === 0) {
    missing.push('items');
  }

  return missing;
}

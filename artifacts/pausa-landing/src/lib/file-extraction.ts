/**
 * Utility to extract text from various file types
 * Supports: TXT, PDF, CSV
 */

import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF worker - use local worker from package
let workerInitialized = false;
let workerInitializationAttempted = false;

function initializePDFWorker() {
  if (workerInitializationAttempted) return;
  workerInitializationAttempted = true;
  
  try {
    // Set worker from the pdfjs-dist package - this is the most reliable approach
    // The worker is bundled with the npm package, so no external CDN needed
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    
    workerInitialized = true;
    console.log('PDF worker configured from local package');
  } catch (localError) {
    console.warn('Could not use local worker, trying CDN fallbacks:', localError);
    
    // Fallback 1: Try unpkg CDN
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
      workerInitialized = true;
      console.log('PDF worker configured with unpkg CDN');
      return;
    } catch (error1) {
      console.warn('unpkg CDN failed:', error1);
    }
    
    // Fallback 2: Try jsdelivr CDN
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
      workerInitialized = true;
      console.log('PDF worker configured with jsdelivr CDN');
      return;
    } catch (error2) {
      console.warn('jsdelivr CDN failed:', error2);
    }
    
    console.error('Failed to initialize PDF worker with all methods');
    workerInitialized = false;
  }
}

// Initialize immediately on module load
if (typeof window !== 'undefined') {
  initializePDFWorker();
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Ensure worker is initialized
    if (!workerInitialized && !workerInitializationAttempted) {
      initializePDFWorker();
    }
    
    console.log(`Starting PDF extraction for file: ${file.name} (${file.size} bytes)`);
    const arrayBuffer = await file.arrayBuffer();
    console.log('File read as ArrayBuffer');
    
    // Use getDocument with proper configuration
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      disableAutoFetch: false,
    });
    
    loadingTask.onProgress = (progress: any) => {
      console.log(`PDF loading progress: ${progress.loaded}/${progress.total}`);
    };
    
    console.log('Getting PDF document...');
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
    
    if (!pdf || !pdf.numPages) {
      throw new Error('Invalid PDF file - no pages found');
    }
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20);
    console.log(`Extracting text from up to ${maxPages} pages`);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`Extracting page ${pageNum}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        if (!textContent || !textContent.items) {
          console.warn(`Page ${pageNum} has no text content`);
          continue;
        }
        
        const pageText = textContent.items
          .map((item: any) => (item.str || '').trim())
          .filter(str => str.length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
          console.log(`Page ${pageNum}: extracted ${pageText.length} characters`);
        }
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        // Continue with next page even if one fails
        continue;
      }
    }
    
    console.log(`Total extracted text: ${fullText.length} characters`);
    
    if (!fullText.trim()) {
      throw new Error('No text could be extracted from the PDF. It may be a scanned image or empty document.');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`${errorMessage}. Please try a different file.`);
  }
}

async function extractTextFromCSV(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Parse CSV to make it more readable
    const lines = text.split('\n');
    return lines
      .map((line) => {
        // Split by comma and format nicely
        return line.split(',').map(cell => cell.trim()).join(' | ');
      })
      .join('\n');
  } catch (error) {
    console.error('Error extracting CSV text:', error);
    throw new Error('Failed to extract text from CSV');
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileName.endsWith('.csv')) {
    return extractTextFromCSV(file);
  } else if (fileName.endsWith('.txt')) {
    return file.text();
  } else {
    // Try to read as text for unknown formats
    try {
      return await file.text();
    } catch {
      throw new Error(
        `Unsupported file format: ${file.type}. Please use PDF, CSV, or TXT files.`
      );
    }
  }
}

export { extractTextFromFile, extractTextFromPDF, extractTextFromCSV };

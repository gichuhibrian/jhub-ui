/**
 * AWS S3 Upload Utility
 * 
 * For production, you would:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 2. Set up environment variables for AWS credentials
 * 3. Use presigned URLs from backend for secure uploads
 * 
 * For now, we'll use a simple approach with base64 encoding
 * or you can integrate with a service like Uploadcare, Cloudinary, etc.
 */

export interface UploadResult {
  url: string;
  fileName: string;
}

/**
 * Upload file to storage
 * This is a placeholder - in production, replace with actual S3 upload
 */
export async function uploadFileToS3(file: File): Promise<UploadResult> {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // For now, convert to base64 data URL
  // In production, this would upload to S3 and return the S3 URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        fileName: file.name,
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();
  
  const iconMap: Record<string, string> = {
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📝',
    rtf: '📝',
    
    // Spreadsheets
    xls: '📊',
    xlsx: '📊',
    csv: '📊',
    
    // Presentations
    ppt: '📊',
    pptx: '📊',
    
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    
    // Code
    js: '💻',
    ts: '💻',
    jsx: '💻',
    tsx: '💻',
    html: '💻',
    css: '💻',
    json: '💻',
    xml: '💻',
    
    // Other
    default: '📎',
  };
  
  return iconMap[ext] || iconMap.default;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

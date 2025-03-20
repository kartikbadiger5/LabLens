// FileUpload.tsx
'use client'; // Required for Next.js client components

import { useCallback, useState} from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  onUploadSuccess: (report: any) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

const FileUpload = ({
  onUploadSuccess,
  maxSizeMB = 5,
  allowedTypes = ['application/pdf']
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Validation logic
  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF files are allowed');
      return false;
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      setFileError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    
    return true;
  };

  // File processing
  const processFile = async (file: File) => {
    setIsUploading(true);
    setFileError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      onUploadSuccess(response.data);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        
        <div className="space-y-2">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the PDF here</p>
            ) : (
              <>
                <p className="font-medium">Drag and drop lab report PDF</p>
                <p className="text-sm">or click to browse</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Max size: {maxSizeMB}MB • PDF only
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedFile.name}
            </span>
            <span className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Status Indicators */}
      {isUploading && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>Analyzing report...</span>
        </div>
      )}

      {fileError && (
        <div className="text-red-600 text-sm flex items-center space-x-2">
          <XMarkIcon className="h-5 w-5" />
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
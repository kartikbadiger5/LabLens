// frontend/src/lib/hooks/useFileUpload.ts
import { useState } from 'react';
import { uploadReport } from '../api/endpoints';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const data = await uploadReport(file);
      setReportData(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return { uploading, error, reportData, upload };
};

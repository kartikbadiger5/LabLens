// frontend/src/lib/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { getReportHistory, getReportById, getDietPlan } from '../api/endpoints';

export const useReportHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getReportHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch report history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, loading, error, fetchHistory };
};

export const useReportDetail = (reportId: string) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getReportById(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  return { report, loading, error };
};

export const useDietPlan = (reportId: string) => {
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDietPlan = async () => {
    setLoading(true);
    try {
      const data = await getDietPlan(reportId);
      setDietPlan(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch diet plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchDietPlan();
    }
  }, [reportId]);

  return { dietPlan, loading, error };
};

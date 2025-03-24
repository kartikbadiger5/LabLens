'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';
import { FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalysisResponse {
  upload_details: {
    filename: string;
    report_id: number;
    message: string;
  };
  analysis: {
    patient_info: {
      name: string;
      age: string;
      gender: string;
      patient_id: string;
    };
    clinical_findings: {
      abnormal_results: Array<{
        test_name: string;
        result: string;
        normal_range: string;
        significance: string;
      }>;
      critical_alerts: string[];
    };
    recommendations: {
      immediate_actions: string[];
      lifestyle_changes: string[];
      follow_up_tests: string[];
    };
    warnings: string[];
    population_comparison?: {
      benchmark: string;
      normal_distribution: string;
      commentary: string;
    };
  };
  audio_summary?: {
    content: string;
    content_type: string;
    text_length: number;
  };
  visualization_data?: {
    trends: Array<{
      test_name: string;
      current_value: number | null;
      normal_min: number | null;
      normal_max: number | null;
    }>;
  };
}

export default function ViewReportPage() {
  const router = useRouter();
  const { report_id } = useParams();
  const [reportData, setReportData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendation' | 'trends' | 'population'>('summary');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else if (report_id && typeof report_id === 'string') {
      fetchReport(report_id, token);
    }
  }, [report_id, router]);

  const fetchReport = async (id: string, token: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to fetch report');
      }
      const data: AnalysisResponse = await res.json();
      setReportData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleReadAudio = () => {
    if (reportData?.audio_summary?.content) {
      try {
        const utterance = new SpeechSynthesisUtterance(reportData.audio_summary.content);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error reading audio summary:', error);
        alert('Failed to play audio summary.');
      }
    } else {
      alert('No audio summary available');
    }
  };

  // Summary tab: displays patient info and abnormal results.
  const renderSummary = () => {
    if (!reportData) return null;
    const { analysis } = reportData;
    const abnormal = analysis.clinical_findings.abnormal_results;
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4">Patient Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-medium">Name:</span> {analysis.patient_info.name}</div>
            <div><span className="font-medium">Age:</span> {analysis.patient_info.age}</div>
            <div><span className="font-medium">Gender:</span> {analysis.patient_info.gender}</div>
            <div><span className="font-medium">Patient ID:</span> {analysis.patient_info.patient_id}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4">Abnormal Results</h3>
          {abnormal.length === 0 ? (
            <p className="text-gray-700">No abnormal results detected.</p>
          ) : (
            <ul className="list-disc pl-5 text-gray-700">
              {abnormal.map((item, index) => (
                <li key={index}>
                  {item.test_name}: {item.result} (Normal: {item.normal_range})
                  <span className="text-sm text-gray-600"> - {item.significance.split('.')[0]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <p className="text-sm text-gray-500 italic">
              See the Recommendations tab for further details.
            </p>
          </div>
          {reportData.audio_summary && (
            <button
              onClick={handleReadAudio}
              className="mt-4 inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              Read Out Summary
            </button>
          )}
        </div>
      </div>
    );
  };

  // Recommendation tab: displays recommendations.
  const renderRecommendation = () => {
    if (!reportData) return null;
    const rec = reportData.analysis.recommendations;
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-semibold text-green-800 mb-4">Immediate Actions</h3>
          <ul className="list-disc pl-5 text-gray-700">
            {rec.immediate_actions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">Lifestyle Changes</h3>
          <ul className="list-disc pl-5 text-gray-700">
            {rec.lifestyle_changes.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Follow-up Tests</h3>
          <ul className="list-disc pl-5 text-gray-700">
            {rec.follow_up_tests.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Trends tab: renders graphs using visualization_data.
  const renderTrends = () => {
    if (!reportData?.visualization_data?.trends) return (
      <p className="text-gray-700 p-4">No trend data available.</p>
    );
    const validTrends = reportData.visualization_data.trends.filter(
      trend =>
        trend.current_value !== null &&
        trend.normal_min !== null &&
        trend.normal_max !== null
    );
    if (!validTrends.length) {
      return <p className="text-gray-700 p-4">No trend data available.</p>;
    }
    return (
      <div className="space-y-6 p-4">
        {validTrends.map((trend, index) => {
          const chartData = [
            {
              category: trend.test_name,
              'Normal Min': trend.normal_min,
              'Current Value': trend.current_value,
              'Normal Max': trend.normal_max,
            },
          ];
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">{trend.test_name} Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Normal Min" fill="#82ca9d" name="Normal Min" />
                  <Bar dataKey="Current Value" fill="#8884d8" name="Current Value" />
                  <Bar dataKey="Normal Max" fill="#ffc658" name="Normal Max" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Normal Min: {trend.normal_min}</span>
                <span>Current: {trend.current_value}</span>
                <span>Normal Max: {trend.normal_max}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Population tab: displays population comparison data.
  const renderPopulation = () => {
    if (!reportData?.analysis.population_comparison) {
      return (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-xl font-semibold text-red-800 mb-4">Population Health Comparison</h3>
          <p className="text-gray-700">Population comparison data is not available.</p>
        </div>
      );
    }
    const { benchmark, normal_distribution, commentary } = reportData.analysis.population_comparison;
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Population Health Comparison</h3>
        <p className="mb-2 text-gray-700">
          <span className="font-bold">Benchmark:</span> {benchmark}
        </p>
        <p className="mb-2 text-gray-700">
          <span className="font-bold">Normal Distribution:</span> {normal_distribution}
        </p>
        <p className='text-gray-700'>
          <span className="font-bold">Commentary:</span> {commentary}
        </p>
      </div>
    );
  };

  const tabs = ['summary', 'recommendation', 'trends', 'population'] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Report Details</h1>
            <p className="mt-2 text-blue-100">Detailed analysis of your lab report</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 inline-flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">Loading report...</p>
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : reportData ? (
            <>
              <nav className="flex space-x-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
              {activeTab === 'summary' && renderSummary()}
              {activeTab === 'recommendation' && renderRecommendation()}
              {activeTab === 'trends' && renderTrends()}
              {activeTab === 'population' && renderPopulation()}
            </>
          ) : (
            <p className="text-center text-gray-600">No report data found.</p>
          )}
        </main>
      </div>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>LABLENS</p>
          <p className="text-gray-400 mt-1">
          AI-powered insights for your health data.
          </p>
        </div>
      </footer>
    </div>
  );
}
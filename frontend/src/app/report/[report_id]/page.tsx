'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';
import { FileText, Activity, User } from 'lucide-react';

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
  };
  audio_summary?: {
    content: string;
    content_type: string;
    text_length: number;
  };
}

export default function ReportPage() {
  const router = useRouter();
  const { report_id } = useParams(); // Extract dynamic report id from URL
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendation' | 'trends'>('summary');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else if (report_id) {
      fetchReport(token);
    }
  }, [report_id]);

  const fetchReport = async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/${report_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch report details');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleReadAudio = () => {
    if (results?.audio_summary?.content) {
      const utterance = new SpeechSynthesisUtterance(results.audio_summary.content);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('No audio summary available');
    }
  };

  const renderSummary = () => {
    if (!results) return null;
    const { analysis } = results;
    const abnormal = analysis.clinical_findings.abnormal_results;
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4">Patient Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div>
              <span className="font-medium">Name:</span> {analysis.patient_info.name}
            </div>
            <div>
              <span className="font-medium">Age:</span> {analysis.patient_info.age}
            </div>
            <div>
              <span className="font-medium">Gender:</span> {analysis.patient_info.gender}
            </div>
            <div>
              <span className="font-medium">Patient ID:</span> {analysis.patient_info.patient_id}
            </div>
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
                  <span className="text-sm text-gray-600">
                    {' '}
                    - {item.significance.split('.')[0]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <p className="text-sm text-gray-500 italic">
              See the Recommendations tab for further details.
            </p>
          </div>
          {results.audio_summary && (
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

  const renderRecommendation = () => {
    if (!results) return null;
    const rec = results.analysis.recommendations;
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

  const renderTrends = () => {
    if (!results) return null;
    const abnormal = results.analysis.clinical_findings.abnormal_results;
    if (abnormal.length === 0) return <p className="text-gray-700">No abnormal test trends available.</p>;

    const testToGraph = abnormal[0];
    const baseValue = parseFloat(testToGraph.result);
    const trendData = [
      { date: '2024-09-15', value: baseValue * 0.95 },
      { date: '2024-12-15', value: baseValue },
      { date: '2025-03-15', value: baseValue * 1.05 }
    ];
    const viewBoxWidth = 400;
    const viewBoxHeight = 200;
    const maxValue = Math.max(...trendData.map(d => d.value)) * 1.1;
    const barGap = 10;
    const barWidth = (viewBoxWidth - (trendData.length + 1) * barGap) / trendData.length;

    return (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <h3 className="text-xl font-semibold text-purple-800 mb-4">{testToGraph.test_name} Trend</h3>
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            {trendData.map((data, i) => {
              const x = barGap + i * (barWidth + barGap);
              const barHeight = (data.value / maxValue) * (viewBoxHeight - 20);
              const y = viewBoxHeight - barHeight - 10;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barWidth} height={barHeight} fill="#6B46C1" rx="2" />
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fill="#6B46C1"
                    fontSize="10"
                  >
                    {data.value.toFixed(1)}
                  </text>
                </g>
              );
            })}
            <line x1="0" y1={viewBoxHeight - 10} x2={viewBoxWidth} y2={viewBoxHeight - 10} stroke="#ccc" strokeWidth="1" />
          </svg>
        </div>
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          {trendData.map((data, i) => (
            <span key={i}>{data.date.split('-')[1]}/{data.date.split('-')[0].substring(2)}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }
    if (!results) {
      return <p className="text-center text-gray-600">No report data available.</p>;
    }
    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'recommendation':
        return renderRecommendation();
      case 'trends':
        return renderTrends();
      default:
        return renderSummary();
    }
  };

  const tabs = ['summary', 'recommendation', 'trends'] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Report Details</h1>
            <p className="mt-2 text-blue-100">Detailed analysis of your lab report</p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-grow">
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
          {renderContent()}
        </main>
      </div>
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>MedInsight AI - Hackathon Proof of Concept</p>
          <p className="text-gray-400 mt-1">
            This is a demonstration prototype. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}


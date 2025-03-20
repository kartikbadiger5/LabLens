'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';
import { Upload, FileText, Activity, Info, AlertTriangle, User } from 'lucide-react';

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
    content: string; // Base64-encoded text
    content_type: string;
    text_length: number;
  };
}

export default function LabReportAnalyzer() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendation' | 'trends'>('summary');

  // Protect the page: redirect if not logged in.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Handle file selection.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  // Handle analysis: call the actual API endpoint.
  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authorized');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to analyze report');
      }
      const data = await res.json();
      setResults(data);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio read-out using SpeechSynthesis API with Base64 decoding.
// Audio read-out using Base64 audio file
const handleReadAudio = () => {
  if (results?.audio_summary?.content && results?.audio_summary?.content_type) {
    try {
      // Create a data URL from the Base64 encoded audio.
      const audioSrc = `data:${results.audio_summary.content_type};base64,${results.audio_summary.content}`;
      const audio = new Audio(audioSrc);
      audio.play();
    } catch (error) {
      console.error('Error playing audio summary:', error);
      alert('Failed to play audio summary.');
    }
  } else {
    alert('No audio summary available');
  }
};

  // Render Loading Component.
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-4"></div>
      <p className="text-gray-600 text-lg font-medium">Analyzing your report, please wait...</p>
    </div>
  );

  // Render Summary Tab.
  const renderSummary = () => {
    if (!results) return null;
    const { analysis } = results;
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

  // Render Recommendation Tab.
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

  // Render Trends Tab with a Bar Chart.
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

  const renderUploadView = () => (
    <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
      <label className="flex flex-col items-center px-8 py-12 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 rounded-xl shadow-lg cursor-pointer border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all duration-300 min-w-[400px] min-h-[300px]">
        <Upload className="h-16 w-16 mb-6 text-indigo-600" />
        <span className="text-2xl font-semibold">Upload Lab Report</span>
        <span className="text-sm text-indigo-500 mt-2">PDF format only</span>
        <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
      </label>
      {file && (
        <div className="mt-6 text-center">
          <p className="text-gray-700 mb-2">
            Selected file: <span className="font-medium">{file.name}</span>
          </p>
          <button 
            onClick={handleAnalyze}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition duration-300"
          >
            Analyze Report
          </button>
        </div>
      )}
    </div>
  );

  const tabs = ['summary', 'recommendation', 'trends'] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Lab Report Analysis</h1>
            <p className="mt-2 text-blue-100">AI-powered insights for your health data</p>
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
          {results ? (
            <>
              {activeTab === 'summary' && renderSummary()}
              {activeTab === 'recommendation' && renderRecommendation()}
              {activeTab === 'trends' && renderTrends()}
            </>
          ) : (
            renderUploadView()
          )}
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


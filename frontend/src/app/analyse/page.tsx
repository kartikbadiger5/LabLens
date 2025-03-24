'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';
import { Upload, FileText, Activity } from 'lucide-react';
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
import dynamic from 'next/dynamic';

// Dynamically import the 3D model component with no SSR
const AnatomyModelViewer = dynamic(
  () => import('@/app/components/report/AnatomyModelViewer'),
  { ssr: false }
);

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
    content: string; // Base64-encoded audio
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

// Blood test data interface to pass to 3D model
interface BloodTestData {
  [key: string]: {
    value: number;
    unit: string;
    normalRange: string;
    status: "normal" | "high" | "low";
    position: { x: number; y: number; z: number };
    description: string;
  };
}

export default function LabReportAnalyzer() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'recommendation' | 'trends' | 'population' | 'anatomy'>('summary');
  
  // Blood test data for the 3D model - will be populated based on analysis results
  const [bloodTestData, setBloodTestData] = useState<BloodTestData>({
    "hemoglobin": {
      value: 14.2,
      unit: "g/dL",
      normalRange: "13.5-17.5",
      status: "normal",
      position: { x: 0.1, y: 0.8, z: 0.04 },
      description: "Hemoglobin - transports oxygen throughout the body"
    },
    "whiteBloodCells": {
      value: 7.5,
      unit: "10³/μL",
      normalRange: "4.5-11.0",
      status: "normal",
      position: { x: 0.6, y: 0.6, z: -0.06 },
      description: "White Blood Cells - helps fight infection"
    },
    "platelets": {
      value: 380,
      unit: "10³/μL",
      normalRange: "150-450",
      status: "normal",
      position: { x: 0.2, y: -0.3, z: -0.05 },
      description: "Platelets - helps blood clotting"
    },
    "cholesterol": {
      value: 240,
      unit: "mg/dL",
      normalRange: "<200",
      status: "high",
      position: { x: 0, y: 0.5, z: 0.04 },
      description: "Cholesterol - fatty substance in blood"
    },
    "glucose": {
      value: 92,
      unit: "mg/dL",
      normalRange: "70-99",
      status: "normal",
      position: { x: -0.2, y: 0.1, z: 0.01 },
      description: "Glucose - blood sugar level"
    }
  });

  // Protect the page: redirect if not logged in.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Update the blood test data when results change
  useEffect(() => {
    if (results && results.analysis.clinical_findings.abnormal_results.length > 0) {
      const updatedData = { ...bloodTestData };
      
      // Update model data based on abnormal test results
      results.analysis.clinical_findings.abnormal_results.forEach(abnormal => {
        const testName = abnormal.test_name.toLowerCase().replace(/\s+/g, '');
        
        // Only update if we have this test in the model
        if (updatedData[testName]) {
          // Extract numeric value from result string
          const numericValue = parseFloat(abnormal.result.replace(/[^\d.-]/g, ''));
          
          if (!isNaN(numericValue)) {
            updatedData[testName].value = numericValue;
            
            // Parse normal range to determine if high or low
            const rangeParts = abnormal.normal_range.split('-');
            if (rangeParts.length === 2) {
              const minVal = parseFloat(rangeParts[0]);
              const maxVal = parseFloat(rangeParts[1]);
              
              if (numericValue < minVal) {
                updatedData[testName].status = "low";
              } else if (numericValue > maxVal) {
                updatedData[testName].status = "high";
              }
            } else if (abnormal.normal_range.includes('<')) {
              const maxVal = parseFloat(abnormal.normal_range.replace(/[^0-9.]/g, ''));
              if (numericValue > maxVal) {
                updatedData[testName].status = "high";
              }
            }
            
            updatedData[testName].normalRange = abnormal.normal_range;
            updatedData[testName].description = `${abnormal.test_name} - ${abnormal.significance.split('.')[0]}`;
          }
        }
      });
      
      setBloodTestData(updatedData);
    }
  }, [results]);

  // Handle file selection.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  // Handle analysis: call the API endpoint.
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

  // Audio read-out using Base64 audio file.
  const handleReadAudio = () => {
    if (results?.audio_summary?.content && results?.audio_summary?.content_type) {
      try {
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

  // Render Trends Tab using visualization_data.
  const renderTrends = () => {
    if (!results || !results.visualization_data) return null;
    const trends = results.visualization_data.trends;
    const validTrends = trends.filter(
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

  // Render Population Comparison Tab.
  const renderPopulationComparison = () => {
    if (!results || !results.analysis.population_comparison) {
      return (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-xl font-semibold text-red-800 mb-4">
            Population Health Comparison
          </h3>
          <p className="text-gray-700">Population comparison data is not available.</p>
        </div>
      );
    }
    const { benchmark, normal_distribution, commentary } =
      results.analysis.population_comparison;
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
        <h3 className="text-xl font-semibold text-indigo-800 mb-4">Population Health Comparison</h3>
        <p className="mb-2 text-gray-700">
          <span className="font-bold">Benchmark:</span> {benchmark}
        </p>
        <p className="mb-2 text-gray-700">
          <span className="font-bold">Normal Distribution:</span> {normal_distribution}
        </p>
        <p className="text-gray-700">
          <span className="font-bold">Commentary:</span> {commentary}
        </p>
      </div>
    );
  };

  // Render 3D Anatomy Model Tab (new)
  // Render 3D Anatomy Model Tab
const renderAnatomyModel = () => {
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
        <h3 className="text-xl font-semibold text-orange-800 mb-4">
          3D Anatomy Visualization
        </h3>
        <p className="text-gray-700">Please analyze a report first to view the 3D anatomy visualization.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
      <h3 className="text-xl font-semibold text-orange-800 mb-4">3D Anatomy Visualization</h3>
      <p className="text-gray-700 mb-4">
        Interactive 3D model showing abnormal test results in their corresponding body locations.
        Click on colored markers to view detailed test information.
      </p>
      <div className="relative h-[70vh] w-full rounded-lg overflow-hidden border border-gray-200" 
           style={{ backgroundColor: 'black' }}
      >
        <style jsx>{`
          /* Target the model viewer's root element with higher specificity */
          div :global(.anatomy-model-container),
          div :global(.model-viewer-root),
          div :global(.anatomy-canvas-container) {
            background-color: black !important;
          }
        `}</style>
        <AnatomyModelViewer bloodTestData={bloodTestData} />
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

  const tabs = ['summary', 'recommendation', 'trends', 'population', 'anatomy'] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Lab Report Analysis</h1>
              <p className="mt-2 text-blue-100">AI-powered insights for your health data</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-grow">
          {isLoading ? (
            renderLoading()
          ) : results ? (
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
              {activeTab === 'population' && renderPopulationComparison()}
              {activeTab === 'anatomy' && renderAnatomyModel()}
            </>
          ) : (
            renderUploadView()
          )}
        </main>
      </div>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>LABLENS @2025</p>
          <p className="text-gray-400 mt-1">
            AI-powered insights for your health data
          </p>
        </div>
      </footer>
    </div>
  );
}
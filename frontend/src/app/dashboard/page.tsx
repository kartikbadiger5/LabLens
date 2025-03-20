'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, BarChart2, Mail } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Protect dashboard: if no token, redirect to login.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else {
      fetchReports(token);
    }
  }, [router]);

  // Fetch lab report history from the API.
  const fetchReports = async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/history`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await res.json();
      setReports(data.history); // Assumes API returns { "user_id": <id>, "history": [ ... ] }
    } catch (err) {
      console.error(err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Logout: clear tokens and redirect to login.
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  // Filter reports based on the search query.
  const filteredReports = reports.filter((report) =>
    report.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Navigate to the upload PDF page.
  const handleUploadPdf = () => {
    router.push('/dashboard/upload');
  };

  // Download the report PDF by calling the API, decoding the Base64 response, and triggering a download.
  async function handleDownloadReport(reportId: string) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authorized');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/download-pdf/${reportId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to download PDF');
      }
      const data = await res.json();
      const base64PDF = data.pdf_content; // your key name
      // Decode the Base64 string into binary data.
      const binary = atob(base64PDF);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to download PDF');
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animated-gradient {
          background: linear-gradient(270deg, #f9fafb, #e5e7eb, #f9fafb);
          background-size: 600% 600%;
          animation: gradient 10s ease infinite;
        }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-white to-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-indigo-700 to-purple-700 text-white shadow-md p-6 hidden md:block">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">LabLens</h2>
            <button onClick={handleLogout} title="Logout" className="hover:text-red-300">
              <LogOut className="h-6 w-6" />
            </button>
          </div>
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/dashboard/profile" className="flex items-center gap-2 hover:text-indigo-200">
                  <User className="h-5 w-5" />
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/analyse" className="flex items-center gap-2 hover:text-indigo-200">
                  <BarChart2 className="h-5 w-5" />
                  Analyses
                </Link>
              </li>
              <li>
                <Link href="/dashboard/contact" className="flex items-center gap-2 hover:text-indigo-200">
                  <Mail className="h-5 w-5" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-700 hover:text-red-600">
              <User className="h-8 w-8 rounded-full border border-gray-300 p-1" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </header>

          {/* Control Bar: Search and Upload Button */}
          <div className="mx-6 my-4 flex items-center justify-between">
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-600"
              />
            </div>
            <button
              onClick={handleUploadPdf}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Upload PDF for Analysis
            </button>
          </div>

          {/* Reports List Container with Animated Gradient */}
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="mx-6 mb-8 p-6 rounded-xl shadow-lg animated-gradient">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Lab Reports</h2>
              {loading ? (
                <p className="text-center text-gray-800">Loading reports...</p>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : (
                <>
                  {filteredReports.length === 0 ? (
                    <p className="text-center text-gray-600">No reports found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredReports.map((report) => (
                        <div
                          key={report.report_id}
                          className="p-4 border rounded-lg hover:bg-indigo-50 transition-colors bg-white flex flex-col md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{report.filename}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(report.uploaded_at * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0 flex gap-3">
                            <Link href={`/report/${report.report_id}`}>
                              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                View Report
                              </button>
                            </Link>
                            <Link href={`/dietplan/${report.report_id}`}>
                              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Diet Plan
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDownloadReport(report.report_id.toString())}
                              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Download Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}



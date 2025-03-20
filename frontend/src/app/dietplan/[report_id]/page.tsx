'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';
import { ClipboardList, Lightbulb, User } from 'lucide-react';

interface DietPlanResponse {
  report_id: number;
  diet_plan: {
    diet_recommendations: Array<{
      meal: string;
      foods: string[];
      reason: string;
    }>;
    general_nutrition_tips: string[];
  };
}

export default function DietPlanPage() {
  const router = useRouter();
  const { report_id } = useParams();
  const [dietPlan, setDietPlan] = useState<DietPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'nutrition'>('recommendations');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    } else if (report_id) {
      fetchDietPlan(token);
    }
  }, [report_id]);

  const fetchDietPlan = async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reports/reports/${report_id}/diet-plan`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch diet plan');
      }
      const data: DietPlanResponse = await res.json();
      setDietPlan(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendations = () => {
    if (!dietPlan) return null;
    const recommendations = dietPlan.diet_plan.diet_recommendations;
    return (
      <div className="space-y-6 p-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold text-indigo-800 mb-2">{rec.meal}</h3>
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Foods:</span> {rec.foods.join(', ')}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Reason:</span> {rec.reason}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderNutritionTips = () => {
    if (!dietPlan) return null;
    const tips = dietPlan.diet_plan.general_nutrition_tips;
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-semibold text-green-800 mb-4">General Nutrition Tips</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="text-gray-800">{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Tabs array for proper typing.
  const tabs = ['recommendations', 'nutrition'] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Diet Plan</h1>
            <p className="mt-2 text-blue-100">Personalized diet recommendations for your report</p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Loading diet plan...</p>
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : dietPlan ? (
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
                    {tab === 'recommendations' ? 'Diet Recommendations' : 'Nutrition Tips'}
                  </button>
                ))}
              </nav>
              {activeTab === 'recommendations' && renderRecommendations()}
              {activeTab === 'nutrition' && renderNutritionTips()}
            </>
          ) : (
            <p className="text-center text-gray-600">No diet plan available.</p>
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


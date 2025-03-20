'use client';

import { BookOpenText, Activity, Utensils, ClipboardList, HeartPulse, BrainCircuit, TestTube2, Stethoscope, CheckCircle } from 'lucide-react';
import NavBar from '@/app/components/navbar/NavBar';
import { motion } from 'framer-motion';

const features = [
  {
    title: "AI Lab Report Analysis",
    icon: <Activity className="h-8 w-8" />,
    description: "Instant, accurate interpretation of your lab results using advanced artificial intelligence",
    benefits: [
      "Comprehensive health insights",
      "Pattern recognition across multiple tests",
      "Historical comparison tracking",
      "Plain-language explanations"
    ],
    color: "bg-indigo-100"
  },
  {
    title: "Personalized Diet Planning",
    icon: <Utensils className="h-8 w-8" />,
    description: "Custom nutrition plans tailored to your specific lab results and health goals",
    benefits: [
      "Nutrient-specific recommendations",
      "Allergy-aware meal suggestions",
      "Grocery list generator",
      "Weekly meal planner"
    ],
    color: "bg-green-100"
  },
  {
    title: "Smart Recommendations",
    icon: <ClipboardList className="h-8 w-8" />,
    description: "Actionable health guidance based on your unique biomarkers",
    benefits: [
      "Lifestyle improvement tips",
      "Supplement recommendations",
      "Exercise regimens",
      "Follow-up test scheduling"
    ],
    color: "bg-amber-100"
  },
  {
    title: "Key Health Indicators",
    icon: <HeartPulse className="h-8 w-8" />,
    description: "Priority-focused analysis of critical biomarkers",
    benefits: [
      "Risk factor identification",
      "Trend visualization",
      "Preventive care alerts",
      "Specialist referral guidance"
    ],
    color: "bg-blue-100"
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Your Health, Enhanced
            </motion.h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Discover powerful tools that transform complex medical data into actionable health insights
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${feature.color} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="flex items-start mb-6">
                  <div className="p-3 rounded-lg bg-white mr-4">
                    {feature.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{feature.title}</h2>
                </div>
                <p className="text-gray-700 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center text-gray-800">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Value Proposition Section */}
          <div className="mt-16 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100">
              <TestTube2 className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose MedInsight AI?
              </h3>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="p-4">
                  <BrainCircuit className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Advanced AI Analysis</h4>
                  <p className="text-gray-600">Machine learning models trained on millions of data points</p>
                </div>
                <div className="p-4">
                  <Stethoscope className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Medical Expertise</h4>
                  <p className="text-gray-600">Developed in collaboration with healthcare professionals</p>
                </div>
                <div className="p-4">
                  <BookOpenText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Continuous Learning</h4>
                  <p className="text-gray-600">Regular updates with latest medical research</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            Empowering health decisions through AI - MedInsight © 2024
          </p>
        </div>
      </footer>
    </div>
  );
} 
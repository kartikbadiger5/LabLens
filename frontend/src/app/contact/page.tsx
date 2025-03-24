'use client';

import React from 'react';
import NavBar from '@/app/components/navbar/NavBar';
import { useRouter } from 'next/navigation';

export default function AboutUsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold">About Us</h1>
            <p className="mt-2 text-blue-100">
              Learn more about LABLENS and our mission to empower health insights.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 inline-flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-10">
          <section className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-indigo-500">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              At LABLENS, we aim to revolutionize healthcare by providing AI-powered insights
              that help individuals and healthcare professionals make informed decisions. Our
              platform is designed to analyze lab reports, generate personalized recommendations,
              and offer actionable insights to improve health outcomes.
            </p>
          </section>
          <section className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-500 mt-8">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              We envision a world where technology bridges the gap between data and understanding,
              empowering everyone to take control of their health. By leveraging cutting-edge AI
              and data visualization, we strive to make health data accessible, actionable, and
              meaningful for all.
            </p>
          </section>
          <section className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-500 mt-8">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">Our Team</h2>
            <p className="text-gray-700 leading-relaxed">
              LABLENS is built by a passionate team of healthcare professionals, data scientists,
              and software engineers. Together, we are committed to delivering innovative solutions
              that make a real difference in people's lives.
            </p>
          </section>
        </main>
      </div>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>LABLENS@2025</p>
          <p className="text-gray-400 mt-1">
            Empowering health insights through AI and innovation.
          </p>
        </div>
      </footer>
    </div>
  );
}
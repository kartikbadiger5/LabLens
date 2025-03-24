// app/page.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ArrowRightIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  CpuChipIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import BackgroundImage from '@/app/public/assets/images/WhatsApp Image 2025-03-19 at 10.14.20 PM.jpeg';
import Script from 'next/script'; // Import Script for Eleven Labs widget

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gradient overlay for background image
  const GradientOverlay = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-blue-900/70 to-purple-900/60" />
  );

  return (
    <div className="min-h-screen relative">
      {/* Eleven Labs Agent Widget */}
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        async
        type="text/javascript"
      />
         <elevenlabs-convai agent-id="LeQc9M40BavEckRhBEZb">  </elevenlabs-convai>

      {/* Background Image with Gradient Overlay */}
      <div className="fixed inset-0 -z-10">
        <Image
          src={BackgroundImage}
          alt="Medical background"
          placeholder="blur"
          quality={100}
          fill
          className="object-cover"
        />
        <GradientOverlay />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="px-4 sm:px-6 lg:px-8 py-4 bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            className="lg:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>

          <div className="flex items-center gap-2 lg:gap-3 flex-1 lg:flex-none">
            <CpuChipIcon className="h-6 w-6 lg:h-7 lg:w-7 text-blue-400" />
            <Link href="/" className="text-xl lg:text-2xl font-bold text-white hover:text-blue-400 transition-colors font-sans">
              LABLENS
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              Home
            </Link>
            <Link href="/features" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              Features
            </Link>
            <Link href="/contact" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              About
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link 
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700 text-sm xl:text-base"
              >
                <UserCircleIcon className="h-5 w-5" />
                Sign In
              </Link>
            </motion.div>
            
           
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="lg:hidden mt-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Mobile menu items */}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        {/* Hero Section */}
        <div className="text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              <span className="block mb-4">YOUR FINGERTIPS</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Empowering Healthcare with AI Tech
              </span>
            </h1>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 text-left"
                >
                  <div className="h-12 w-12 bg-blue-400/10 rounded-lg mb-4 flex items-center justify-center">
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Video Section (Replacement for Brain Section) */}
          <section className="mt-24 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="relative rounded-xl overflow-hidden aspect-video bg-white/5 border border-white/10">
                {/* Placeholder for video - in a real implementation you'd use a video component */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-blue-500/80 flex items-center justify-center cursor-pointer hover:bg-blue-600/80 transition-colors">
                    <PlayIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mt-6">Learn More About LABLENS</h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Discover how our AI-powered technology can transform your healthcare experience 
                and provide valuable insights from your lab results.
              </p>
              
            </motion.div>
          </section>
        </div>
      </main>
      
    </div>
  );
}

const features = [
  {
    icon: BeakerIcon,
    iconColor: 'text-blue-400',
    title: 'Lab Report Analysis with AI',
    description: 'Automated analysis of lab reports to predict health risks and recommend treatments'
  },
  {
    icon: EyeIcon,
    iconColor: 'text-purple-400',
    title: 'Lab Reports Recommendation & Treand',
    description: 'Personalized lab report recommendations based on your health history and medical conditions'
  },
  {
    icon: CpuChipIcon,
    iconColor: 'text-blue-400',
    title: 'Diet Planning ',
    description: 'Personalized diet planning based on report data, lifestyle, and health goals'
    
  },
];
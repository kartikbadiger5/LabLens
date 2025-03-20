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
  EyeIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import BackgroundImage from '@/app/public/assets/images/WhatsApp Image 2025-03-19 at 10.14.20 PM.jpeg';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gradient overlay for background image
  const GradientOverlay = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-blue-900/70 to-purple-900/60" />
  );

  return (
    <div className="min-h-screen relative">
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
              Medallians AI
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              Solutions
            </Link>
            <Link href="/features" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              Technology
            </Link>
            <Link href="/contact" className="text-white/80 hover:text-white transition-colors text-sm xl:text-base font-medium">
              Careers
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link 
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white text-sm xl:text-base"
              >
                <UserCircleIcon className="h-5 w-5" />
                Sign In
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/join"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700 text-sm xl:text-base"
              >
                Join Team
                <ArrowRightIcon className="h-4 w-4" />
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

          {/* Brain Section */}
          <section className="mt-24 text-left max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-block px-4 py-2 bg-purple-400/10 rounded-full mb-6">
                <span className="text-purple-400 font-medium">01</span>
                <span className="text-white ml-2">Unlock the Secrets of Your Brain</span>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">Create appreciation</h2>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-blue-400 font-semibold mb-3">Practical interaction</h4>
                  <p className="text-white/70">At our location in Amsterdam</p>
                </div>

                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-blue-400 font-semibold mb-3">Many biological</h4>
                  <p className="text-white/70">There are two kinds of cells</p>
                </div>
              </div>

              <p className="text-white/80 mt-8 leading-relaxed">
                Our AI technology explores some activity in complex people like your mental and physical well-being. 
                With our ability explanations, we can study your health for more actions.
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
    title: 'Personalized Treatment Plans',
    description: 'A personal agent must maintain optimal health strategies tailored to individual needs'
  },
  {
    icon: EyeIcon,
    iconColor: 'text-purple-400',
    title: 'Medical Image Analysis',
    description: 'Advanced processing of brain scans, sensory patterns, and organ imaging'
  },
  {
    icon: CpuChipIcon,
    iconColor: 'text-blue-400',
    title: 'Drug Discovery',
    description: 'Revolutionizing pharmaceutical research through pattern recognition in biological systems'
  }
];
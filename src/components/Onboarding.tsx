import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { X, Wallet, AtSign, Send, Shield, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Wallet,
    title: 'Welcome to PYUSD Pay',
    description: 'Your secure EVM wallet is automatically created with AES-256 encrypted private keys. Server-side signing keeps your funds safe!',
    gradient: 'from-primary-500 to-primary-600',
  },
  {
    icon: AtSign,
    title: 'Your Payment Handle',
    description: 'Get a simple @username handle for receiving payments. Share it like UPI—no long addresses, just @yourname!',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    icon: Send,
    title: 'Instant Transfers',
    description: 'Send PYUSD to any @handle or wallet address. Create payment links and QR codes for easy receiving. All on Ethereum Sepolia!',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: Shield,
    title: 'Invest & Grow',
    description: 'Invest PYUSD in expert crypto portfolios with auto-rebalancing and real-time Pyth price feeds. Your money works for you!',
    gradient: 'from-blue-500 to-indigo-600',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      handlePrev();
    } else if (info.offset.x < -threshold) {
      handleNext();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50"
        aria-label="Skip onboarding"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="w-full max-w-md">
        {/* Slide Content */}
        <div className="relative h-96 mb-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing"
            >
              {/* Icon */}
              <motion.div
                className={`mb-8 p-8 rounded-full bg-gradient-to-br ${slide.gradient} shadow-xl`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className="w-16 h-16 text-white" />
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {slide.title}
              </h2>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed px-4">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
              aria-label={`Go to slide ${index + 1}`}
            >
              <motion.div
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-gradient-primary'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handlePrev}
              className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all min-h-[56px]"
              whileTap={{ scale: 0.95 }}
              aria-label="Previous slide"
            >
              Back
            </motion.button>
          )}
          <motion.button
            onClick={handleNext}
            className={`${
              currentSlide === 0 ? 'w-full' : 'flex-1'
            } bg-gradient-primary text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-glow transition-all flex items-center justify-center gap-2 min-h-[56px]`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            aria-label={currentSlide === slides.length - 1 ? 'Get started' : 'Next slide'}
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Swipe Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          Swipe or use arrows to navigate
        </motion.p>
      </div>
    </div>
  );
}

// Helper to check if onboarding is needed
export function shouldShowOnboarding(): boolean {
  return localStorage.getItem('onboarding_completed') !== 'true';
}

// Helper to reset onboarding (for testing)
export function resetOnboarding(): void {
  localStorage.removeItem('onboarding_completed');
}

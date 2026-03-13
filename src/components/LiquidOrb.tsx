import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import './LiquidOrb.css';

type LiquidOrbProps = {
  phase: string;
};

export function LiquidOrb({ phase }: LiquidOrbProps) {
  // Определяем, мобильное ли устройство, чтобы уменьшить разрастание
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 450);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 450);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Базовый множитель масштаба для мобильных. Чем он меньше, тем слабее "раздувается" орб на смартфоне.
  const mobileScaleFactor = isMobile ? 0.75 : 1; 

  // Анимация масштаба всего контейнера и силы свечения
  const getContainerState = () => {
    switch (phase) {
      case 'inhale':
        return {
          scale: 1.1 * mobileScaleFactor,
          filter: 'drop-shadow(0 0 80px rgba(27, 255, 255, 0.5))',
        };
      case 'hold':
        return {
          scale: 1.15 * mobileScaleFactor,
          filter: 'drop-shadow(0 0 100px rgba(233, 64, 87, 0.6))',
        };
      case 'exhale':
        return {
          scale: 0.7 * mobileScaleFactor,
          filter: 'drop-shadow(0 0 40px rgba(56, 239, 125, 0.2))',
        };
      case 'holdOut':
        return {
          scale: 0.65 * mobileScaleFactor,
          filter: 'drop-shadow(0 0 20px rgba(56, 239, 125, 0.1))',
        };
      case 'idle':
      default:
        return {
          scale: 0.8 * mobileScaleFactor,
          filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.15))',
        };
    }
  };

  // Цвет самой биомассы
  const getBlobColor = () => {
    switch (phase) {
      case 'inhale':
        return { color: 'var(--orb-breathe-in-color-1)' };
      case 'hold':
        return { color: 'var(--orb-hold-color-1)' };
      case 'exhale':
        return { color: 'var(--orb-breathe-out-color-1)' };
      case 'holdOut':
        return { color: 'var(--orb-breathe-out-color-1)' };
      case 'idle':
      default:
        return { color: 'var(--orb-idle-color-1)' };
    }
  };

  // Цвет вторичных "сгустков" (градиентный микс)
  const getSecondaryColor = () => {
    switch (phase) {
      case 'inhale':
        return { color: 'var(--orb-breathe-in-color-2)' };
      case 'hold':
        return { color: 'var(--orb-hold-color-2)' };
      case 'exhale':
        return { color: 'var(--orb-breathe-out-color-2)' };
      case 'holdOut':
        return { color: 'var(--orb-breathe-out-color-2)' };
      case 'idle':
      default:
        return { color: 'var(--orb-idle-color-2)' };
    }
  };

  return (
    <motion.div 
      className="liquid-orb-container"
      animate={getContainerState()}
      transition={{ duration: phase === 'idle' ? 2 : 4, ease: "easeInOut" }}
    >
      {/* SVG фильтры: Улучшенный Goo (Метаболы) и Жидкий Шум */}
      <svg width="0" height="0" className="svg-filters">
        <defs>
          {/* Фильтр для слипания капель воедино (Gooey effect) */}
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            {/* Матрица цвета для увеличения контраста альфа-канала, делает размытые края четче при слипании, но оставляет само свечение */}
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          
          {/* Фильтр внутреннего фрактального шума */}
          <filter id="liquid-noise-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.8 0" in="noise" result="coloredNoise" />
          </filter>
        </defs>
      </svg>

      <div className="liquid-orb-vessel">
        {/* Основные сгустки "Биомассы" (будут сливаться через Gooey filter) */}
        <motion.div 
          className="bio-blob blob-1"
          animate={getBlobColor()}
          transition={{ duration: phase === 'idle' ? 2 : 4, ease: "easeInOut" }}
        />
        <motion.div 
          className="bio-blob blob-2"
          animate={getSecondaryColor()}
          transition={{ duration: phase === 'idle' ? 2 : 4, ease: "easeInOut" }}
        />
        <motion.div 
          className="bio-blob blob-3"
          animate={getBlobColor()}
          transition={{ duration: phase === 'idle' ? 2 : 4, ease: "easeInOut" }}
        />

        {/* Шум-текстура (Жидкость) */}
        <div className="liquid-orb-fluid" />
        
        {/* Тень ядра и блик (для объема) */}
        <div className="liquid-orb-core-shadow" />
        <div className="liquid-orb-highlight" />
      </div>
    </motion.div>
  );
}

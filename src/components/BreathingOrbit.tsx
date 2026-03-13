import React, { useEffect, useState } from 'react';
import './BreathingOrbit.css';

type PhaseDurations = {
  inhale: number;
  hold: number;
  exhale: number;
  holdOut: number;
};

type BreathingOrbitProps = {
  durations: PhaseDurations;
  currentPhase: 'idle' | 'inhale' | 'inhaleDouble' | 'hold' | 'exhale' | 'holdOut';
  isPlaying: boolean;
  isPhysiological?: boolean; // Флаг для разбивки вдоха на два отрезка
};

export const BreathingOrbit: React.FC<BreathingOrbitProps> = ({ durations, currentPhase, isPlaying, isPhysiological }) => {
  const totalDuration = durations.inhale + durations.hold + durations.exhale + durations.holdOut;
  
  // Для синхронизации CSS анимации индикатора с реальным стартом цикла
  const [cycleKey, setCycleKey] = useState(0);
  
  useEffect(() => {
    // Каждый раз, когда начинается новый вдох, перезапускаем анимацию вращения
    if (currentPhase === 'inhale' && isPlaying) {
      setCycleKey(prev => prev + 1);
    }
  }, [currentPhase, isPlaying]);

  // Радиус и длина окружности
  const radius = 180;
  const circumference = 2 * Math.PI * radius;
  // Небольшой зазор между сегментами, чтобы они были видны как отрезки
  const gap = 12;

  // Функция для расчета stroke-dasharray для каждого сегмента
  const getSegmentStyles = (phaseDuration: number, previousDuration: number) => {
    if (phaseDuration === 0) return { display: 'none' };

    const phasePercentage = phaseDuration / totalDuration;
    const offsetPercentage = previousDuration / totalDuration;
    
    // Длина линии минус gap
    const lineLength = (phasePercentage * circumference) - gap;
    const strokeDasharray = `${Math.max(0, lineLength)} ${circumference}`;
    
    // SVG уже повернут на -90deg в CSS, поэтому просто сдвигаем назад на нужный процент длины круга
    const strokeDashoffset = -1 * (offsetPercentage * circumference);

    return {
      strokeDasharray,
      strokeDashoffset,
    };
  };

  const inhale1Length = isPhysiological ? Math.floor(durations.inhale * 0.7) : durations.inhale;
  const inhale2Length = isPhysiological ? durations.inhale - inhale1Length : 0;

  const inhale1Offset = 0;
  const inhale2Offset = inhale1Offset + inhale1Length;
  const holdOffset = durations.inhale; // hold начинается после всего вдоха (inhale1 + inhale2)
  const exhaleOffset = holdOffset + durations.hold;
  const holdOutOffset = exhaleOffset + durations.exhale;

  return (
    <div className={`orbit-container ${isPlaying ? 'playing' : ''}`}>
      <svg width="400" height="400" className="orbit-svg" viewBox="0 0 400 400">
        
        {/* Базовый трек: белые/серые отрезки */}
        {/* Первый вдох (или единственный) */}
        <circle 
          cx="200" cy="200" r={radius} 
          className="orbit-track-segment"
          style={getSegmentStyles(inhale1Length, inhale1Offset)}
        />
        {/* Довдох (только если physiological) */}
        {isPhysiological && (
          <circle 
            cx="200" cy="200" r={radius} 
            className="orbit-track-segment"
            style={getSegmentStyles(inhale2Length, inhale2Offset)}
          />
        )}
        <circle 
          cx="200" cy="200" r={radius} 
          className="orbit-track-segment"
          style={getSegmentStyles(durations.hold, holdOffset)}
        />
        <circle 
          cx="200" cy="200" r={radius} 
          className="orbit-track-segment"
          style={getSegmentStyles(durations.exhale, exhaleOffset)}
        />
        <circle 
          cx="200" cy="200" r={radius} 
          className="orbit-track-segment"
          style={getSegmentStyles(durations.holdOut, holdOutOffset)}
        />
      </svg>

      {/* Индикатор прогресса (белая точка, бегущая по кругу) */}
      {isPlaying && (
        <div 
          key={`indicator-${cycleKey}`}
          className="orbit-indicator-wrapper"
          style={{ animationDuration: `${totalDuration}ms` }}
        >
          <div className="orbit-indicator-dot" />
        </div>
      )}
    </div>
  );
};

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

  // Функция для расчета stroke-dasharray для каждого сегмента
  const getSegmentStyles = (phaseDuration: number, previousDuration: number) => {
    if (phaseDuration === 0) return { display: 'none' };

    const phasePercentage = phaseDuration / totalDuration;
    const offsetPercentage = previousDuration / totalDuration;
    
    // Длина линии
    const lineLength = (phasePercentage * circumference);
    const strokeDasharray = `${Math.max(0, lineLength)} ${circumference}`;
    
    // SVG уже повернут на -90deg в CSS, поэтому просто сдвигаем назад на нужный процент длины круга
    const strokeDashoffset = -1 * (offsetPercentage * circumference);

    return {
      strokeDasharray,
      strokeDashoffset,
    };
  };

  const inhale1Length = isPhysiological ? Math.floor(durations.inhale * 0.7) : durations.inhale;
  
  // Угол поворота для маркера. (ровно на точке 70% вдоха)
  const inhale1Percentage = isPhysiological ? inhale1Length / totalDuration : 0;
  const markerAngle = isPhysiological ? inhale1Percentage * 360 : 0;

  const inhaleOffset = 0;
  const holdOffset = durations.inhale;
  const exhaleOffset = holdOffset + durations.hold;
  const holdOutOffset = exhaleOffset + durations.exhale;

  return (
    <div className={`orbit-container ${isPlaying ? 'playing' : ''}`}>
      <svg width="400" height="400" className="orbit-svg" viewBox="0 0 400 400">
        
        {/* Базовый трек и маркер (Группа для идеального слияния прозрачности) */}
        <g className="orbit-track-group">
          {/* Сплошной Вдох */}
          <circle 
            cx="200" cy="200" r={radius} 
            className="orbit-track-segment"
            style={getSegmentStyles(durations.inhale, inhaleOffset)}
          />
          
          {/* Узелок Довдоха */}
          {isPhysiological && (
            <g style={{ transform: `rotate(${markerAngle}deg)`, transformOrigin: '200px 200px' }}>
              {/* Точно на линии орбиты (200 + 180 = 380), белый кружок (окрасится в 0.25 прозрачности благодаря группе) */}
              <circle cx="380" cy="200" r="3.5" fill="#FFF" />
            </g>
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
        </g>
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

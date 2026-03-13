import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, ChevronLeft } from 'lucide-react';
import { WebGLOrb } from './components/WebGLOrb';
import { BreathingOrbit } from './components/BreathingOrbit';
import { AudioEngine } from './AudioEngine';
import './App.css';
type Phase = 'idle' | 'inhale' | 'inhaleDouble' | 'hold' | 'exhale' | 'holdOut';
// Типы для пресетов
export type PresetValues = {
  inhale: number;
  hold: number;
  exhale: number;
  holdOut: number;
};

export type BreathPreset = {
  id: string;
  name: string;
  description: string;
  instruction: string;
  durations: PresetValues;
};

export const PRESETS_RU: BreathPreset[] = [
  {
    id: 'box',
    name: 'Квадратное дыхание (Box Breathing)',
    description: 'Успокаивает нервную систему, снимает стресс и возвращает фокус.',
    instruction: 'Делайте вдох через нос, выдох — мягко через расслабленный рот.',
    durations: { inhale: 4000, hold: 4000, exhale: 4000, holdOut: 4000 }
  },
  {
    id: 'relax-478',
    name: 'Глубокий сон (4-7-8)',
    description: 'Техника Эндрю Вейла для мощного расслабления парасимпатической нервной системы перед сном.',
    instruction: 'Язык на нёбе. Вдох носом, задержка, долгий выдох ртом со свистом.',
    durations: { inhale: 4000, hold: 7000, exhale: 8000, holdOut: 0 }
  },
  {
    id: 'coherent',
    name: 'Когерентное дыхание',
    description: 'Максимизирует вариабельность сердечного ритма. Идеально для баланса.',
    instruction: 'Плавный вдох и выдох без пауз. Дышите очень легко.',
    durations: { inhale: 5500, hold: 0, exhale: 5500, holdOut: 0 }
  },
  {
    id: 'physiological',
    name: 'Физиологический вздох',
    description: 'Два вдоха подряд для расправления альвеол и длинный выдох. Мгновенно снимает панику.',
    instruction: 'Два вдоха через нос. Второй короткий до-вдох на вершине. Выдох через рот.',
    durations: { inhale: 3000, hold: 0, exhale: 6000, holdOut: 2000 }
  }
];

export const PRESETS_EN: BreathPreset[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Calms the nervous system, relieves stress and restores focus.',
    instruction: 'Inhale through your nose, exhale softly through a relaxed mouth.',
    durations: { inhale: 4000, hold: 4000, exhale: 4000, holdOut: 4000 }
  },
  {
    id: 'relax-478',
    name: 'Deep Sleep (4-7-8)',
    description: 'Dr. Andrew Weil\'s technique for powerful parasympathetic nervous relaxation.',
    instruction: 'Tongue on your palate. Inhale through nose, hold, long exhale through mouth with a whoosh.',
    durations: { inhale: 4000, hold: 7000, exhale: 8000, holdOut: 0 }
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: 'Maximizes heart rate variability. Ideal for balance.',
    instruction: 'Smooth inhale and exhale without pauses. Breathe very lightly.',
    durations: { inhale: 5500, hold: 0, exhale: 5500, holdOut: 0 }
  },
  {
    id: 'physiological',
    name: 'Physiological Sigh',
    description: 'Two inhales to pop open the alveoli and a long exhale. Instantly relieves panic.',
    instruction: 'Two inhales through the nose. Second is a short top-off. Exhale through the mouth.',
    durations: { inhale: 3000, hold: 0, exhale: 6000, holdOut: 2000 }
  }
];

const TRANSLATIONS = {
  ru: {
    ready: 'Готовы?',
    inhale: 'Вдох...',
    inhaleDouble: 'До-вдох...',
    hold: 'Задержите...',
    exhale: 'Выдох...',
    holdOut: 'Задержите...',
    settingsTitle: 'Дыхательные техники',
    presetsTitle: 'Готовые техники',
    customTitle: 'Собственный ритм',
    customName: 'Свой ритм',
    customDesc: 'Ваши индивидуальные настройки',
    customInst: 'Следуйте своему собственному ритму дыхания.',
    customBtn: 'Настроить вручную',
    customBtnDesc: 'Укажите длину фаз (в секундах). Сохраняется автоматически.',
    labelInhale: 'Вдох',
    labelHold: 'Задержка',
    labelExhale: 'Выдох',
    labelHoldOut: 'Пауза (выдох)',
    startCustom: 'Начать в своём ритме',
    feedback: 'feedback',
    settingsBtn: 'Настройки',
    returnBtn: 'Вернуться к выбору',
    startBtn: 'Начать практику'
  },
  en: {
    ready: 'Ready?',
    inhale: 'Inhale...',
    inhaleDouble: 'Top-off...',
    hold: 'Hold...',
    exhale: 'Exhale...',
    holdOut: 'Hold...',
    settingsTitle: 'Breathing Techniques',
    presetsTitle: 'Presets',
    customTitle: 'Custom Rhythm',
    customName: 'Custom Rhythm',
    customDesc: 'Your unique settings',
    customInst: 'Follow your own breathing rhythm.',
    customBtn: 'Set Manually',
    customBtnDesc: 'Set phase lengths in seconds. Saves automatically.',
    labelInhale: 'Inhale',
    labelHold: 'Hold',
    labelExhale: 'Exhale',
    labelHoldOut: 'Hold out',
    startCustom: 'Start your rhythm',
    feedback: 'feedback',
    settingsBtn: 'Settings',
    returnBtn: 'Back to Presets',
    startBtn: 'Start Practice'
  }
};

const audio = new AudioEngine();

function CustomDurationInput({ label, valueMs, onChange, phaseKey }: { label: string, valueMs: number, onChange: (val: number) => void, phaseKey: string }) {
  const [strValue, setStrValue] = useState((valueMs / 1000).toString());

  useEffect(() => {
    setStrValue((valueMs / 1000).toString());
  }, [valueMs]);

  const updateValue = (newVal: number) => {
    // Не меньше нуля и не больше 60
    const clamped = Math.max(0, Math.min(60, newVal));
    setStrValue(clamped.toString());
    onChange(clamped * 1000);
  };

  const increment = () => updateValue(parseFloat(strValue || '0') + 1);
  const decrement = () => updateValue(parseFloat(strValue || '0') - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStrValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      onChange(num * 1000);
    }
  };

  const handleBlur = () => {
    if (strValue === '' || isNaN(parseFloat(strValue))) {
      setStrValue('0');
      onChange(0);
    } else {
      setStrValue(parseFloat(strValue).toString());
    }
  };

  return (
    <div className={`input-group phase-${phaseKey}`}>
      <label>{label}</label>
      <div className="input-stepper">
        <button className="stepper-btn" onClick={decrement}>-</button>
        <input 
          type="number" 
          min="0" 
          max="60"
          step="0.5"
          value={strValue}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <button className="stepper-btn" onClick={increment}>+</button>
      </div>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState<'ru' | 'en'>(() => {
    return (localStorage.getItem('breatheLang') as 'ru' | 'en') || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('breatheLang', lang);
  }, [lang]);

  const t = TRANSLATIONS[lang];
  const presetsList = lang === 'ru' ? PRESETS_RU : PRESETS_EN;

  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseDuration, setPhaseDuration] = useState(2000); // Базовое время для idle
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return localStorage.getItem('breatheLastPreset') || 'box';
  });
  
  // Сохраняем последний выбранный пресет
  useEffect(() => {
    localStorage.setItem('breatheLastPreset', activePresetId);
  }, [activePresetId]);
  
  // Для кастомного режима сохраняем в localStorage
  const [customDurations, setCustomDurations] = useState<PresetValues>(() => {
    const saved = localStorage.getItem('breatheCustomPreset');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { inhale: 4000, hold: 4000, exhale: 4000, holdOut: 4000 };
  });

  const handleCustomChange = (phaseName: keyof PresetValues, valueMs: number) => {
    const newDurations = { ...customDurations, [phaseName]: valueMs };
    setCustomDurations(newDurations);
    localStorage.setItem('breatheCustomPreset', JSON.stringify(newDurations));
  };

  const activePreset = activePresetId === 'custom' 
    ? { id: 'custom', name: t.customName, description: t.customDesc, instruction: t.customInst, durations: customDurations }
    : (presetsList.find(p => p.id === activePresetId) || presetsList[0]);

  // Temporary mock engine to see visualizer
  useEffect(() => {
    if (!isPlaying) {
      setPhase('idle');
      setPhaseDuration(2000);
      audio.stop();
      return;
    }

    let isMounted = true;
    
    // Вспомогательная функция проигрывания одной фазы
    const playPhase = async (phaseName: Phase, durationMs: number) => {
      if (durationMs <= 0 || !isMounted || !isPlaying) return;
      
      setPhase(phaseName);
      setPhaseDuration(durationMs);
      audio.transitionToPhase(phaseName, durationMs);

      await new Promise(r => setTimeout(r, durationMs));
    };

    const runCycle = async () => {
      await audio.init();
      
      const durationsToUse = activePreset.id === 'custom' ? customDurations : activePreset.durations;
      
      while (isMounted && isPlaying) {
        if (activePreset.id === 'physiological') {
          // Специальная разбивка для Физиологического вздоха: 70% первый вдох, 30% довдох
          const inhale1 = Math.floor(durationsToUse.inhale * 0.7);
          const inhaleDouble = durationsToUse.inhale - inhale1;
          
          await playPhase('inhale', inhale1);
          if (!isMounted || !isPlaying) break;
          
          await playPhase('inhaleDouble', inhaleDouble);
          if (!isMounted || !isPlaying) break;
        } else {
          await playPhase('inhale', durationsToUse.inhale);
          if (!isMounted || !isPlaying) break;
        }
        
        await playPhase('hold', durationsToUse.hold);
        if (!isMounted || !isPlaying) break;
        
        await playPhase('exhale', durationsToUse.exhale);
        if (!isMounted || !isPlaying) break;
        
        await playPhase('holdOut', durationsToUse.holdOut);
      }
    };

    runCycle();
    
    return () => { 
      isMounted = false; 
      audio.stop();
    };
  }, [isPlaying]);

  // Закрытие модалки настроек и остановка практики по кнопке Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (isPlaying) {
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, isPlaying]);

  const getInstruction = () => {
    if (!isPlaying) return t.ready;
    switch (phase) {
      case 'inhale': return t.inhale;
      case 'inhaleDouble': return t.inhaleDouble;
      case 'hold': return t.hold;
      case 'exhale': return t.exhale;
      case 'holdOut': return t.holdOut;
      default: return '';
    }
  };

  return (
    <div className="app-container">

      {/* Экран Настроек (Пресеты) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="settings-modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="settings-header">
              <button className="icon-button" onClick={() => setShowSettings(false)}>
                <ChevronLeft size={24} />
              </button>
              <h2>{t.settingsTitle}</h2>
              <div style={{ width: 48 }} /> {/* Spacer */}
            </div>
            <div className="settings-body">
              {/* Левая колонка: Пресеты */}
              <div className="preset-list">
                <h3>{t.presetsTitle}</h3>
                {presetsList.map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
                    onClick={() => {
                      setActivePresetId(preset.id);
                      if (isPlaying) setIsPlaying(false);
                      setShowSettings(false);
                    }}
                  >
                    <h4>{preset.name}</h4>
                    <p>{preset.description}</p>
                    {activePresetId === preset.id && (
                      <p className="preset-instruction">💡 {preset.instruction}</p>
                    )}
                  </button>
                ))}
              </div>

              {/* Правая колонка: Кастомный режим */}
              <div className="custom-builder">
                <h3>{t.customTitle}</h3>
                <button
                  className={`preset-card ${activePresetId === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setActivePresetId('custom');
                    if (isPlaying) setIsPlaying(false);
                  }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <h4>{t.customBtn}</h4>
                  <p>{t.customBtnDesc}</p>
                </button>

                <div className={`custom-inputs ${activePresetId !== 'custom' ? 'disabled' : ''}`}>
                  {(['inhale', 'hold', 'exhale', 'holdOut'] as const).map(p => (
                    <CustomDurationInput 
                      key={p}
                      phaseKey={p}
                      label={p === 'inhale' ? t.labelInhale : p === 'hold' ? t.labelHold : p === 'exhale' ? t.labelExhale : t.labelHoldOut}
                      valueMs={customDurations[p]}
                      onChange={(valMs) => handleCustomChange(p, valMs)}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {activePresetId === 'custom' && (
                     <motion.button
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="pill-button"
                        style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.1)' }} // Сделали по центру для удобства
                        onClick={async () => {
                          if (!isPlaying) {
                            await audio.init(); 
                          }
                          setShowSettings(false);
                          setIsPlaying(true);
                        }}
                     >
                       <Play size={18} fill="currentColor" />
                       {t.startCustom}
                     </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="settings-footer">
              {/* Раньше тут была ссылка на обратную связь */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: showSettings ? 'none' : 'contents' }}>
        {/* Top Navigation */}
        <header className="top-bar">
          <AnimatePresence>
            {!isPlaying && (
               <motion.button 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="pill-button" 
                onClick={() => setShowSettings(true)}
              >
                <Settings size={18} />
                {t.settingsBtn}
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* Главный экран: Инструкция перед запуском */}
        {!isPlaying && (
          <div className="pre-start-info">
             <h2>{activePreset.name}</h2>
             <p>{activePreset.instruction}</p>
          </div>
        )}

        {/* Main Visualizer Area */}
        <main className="visualizer-area" data-phase={phase}>
          
          {/* SVG Орбита дыхания на заднем плане (за 3D сферой) */}
          {isPlaying && (
            <BreathingOrbit 
              durations={activePreset.durations} 
              currentPhase={phase} 
              isPlaying={isPlaying} 
              isPhysiological={activePresetId === 'physiological'}
            />
          )}
          
          {/* Математическая 3D Био-сфера */}
          <WebGLOrb phase={phase} duration={phaseDuration} />

          {/* Текстовые инструкции (выровняны сверху благодаря CSS классу) */}
          <div className="instruction-text" style={{ pointerEvents: 'none', position: 'absolute', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: 'easeInOut' }} // Очень плавное перетекание (1 секунда)
                  style={{ position: 'absolute' }}
                >
                  {getInstruction()}
                  <div className="countdown-text">
                    {(phaseDuration / 1000).toFixed(1).replace('.0', '')}s
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Bottom Controls (видна всегда, кроме настроек) */}
      {!showSettings && (
        <footer className="bottom-bar">
          <button 
            className="pill-button"
            onClick={async () => {
              if (showSettings) return; // резервная проверка
              if (!isPlaying) {
                await audio.init(); 
              }
              setIsPlaying(!isPlaying);
            }}
            style={{ 
              padding: '16px 32px', 
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={20} fill="currentColor" />
                {t.returnBtn}
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                {t.startBtn}
              </>
            )}
          </button>
        </footer>
      )}

      {/* Угловые элементы (язык и feedback) */}
      <div className="corner-controls" style={{ display: showSettings ? 'none' : 'flex' }}>
        <div className="lang-switch">
          <span className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')} style={{ cursor: 'pointer' }}>Ru</span>
          <span className="separator">/</span>
          <span className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} style={{ cursor: 'pointer' }}>En</span>
        </div>
        
        {/* Обратная связь - Telegram создателя */}
        <a href="https://t.me/dmt_terek" target="_blank" rel="noreferrer" className="corner-feedback">
          {t.feedback}
        </a>
      </div>
    </div>
  );
}

export default App;

/**
 * Audio Engine: "Soft Guided Chimes"
 *
 * Воспроизводит только мягкие колокольчики на границах фаз, 
 * обеспечивая ритм, но оставляя максимальную тишину для сосредоточения на дыхании.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private reverbNode: ConvolverNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  public async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.reverbNode) {
      // Мастер-компрессор для склеивания звука и предотвращения искажений
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -12;
      this.masterCompressor.ratio.value = 4;
      this.masterCompressor.connect(this.ctx.destination);

      // Сверточный ревербератор (Convolver) для эффекта мягкого отражения
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.generateReverbBuffer(this.ctx, 0.8); // Укоротили хвост до 0.8 сек
      
      // Смешиваем чистый сигнал и реверберацию (Wet / Dry)
      const wetGain = this.ctx.createGain();
      wetGain.gain.value = 0.8; // Еще больше "мокрого" сигнала для эмбиента
      
      this.reverbNode.connect(wetGain);
      wetGain.connect(this.masterCompressor);
    }
  }

  // Генерация Impulse Response для реверберации (эффект огромного зала)
  private generateReverbBuffer(ctx: AudioContext, lengthSeconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * lengthSeconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Белый шум умноженный на экспоненциальный спад
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 5);
      }
    }
    return buffer;
  }

  public start() {
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
  }

  public stop() {
    if (!this.ctx || !this.isPlaying) return;
    this.isPlaying = false;
  }

  public transitionToPhase(phase: 'inhale' | 'inhaleDouble' | 'hold' | 'exhale' | 'holdOut' | 'idle', durationMs: number) {
    if (!this.ctx || phase === 'idle') return;
    
    // Если движок не стартовал, стартуем его
    if (!this.isPlaying) {
       this.start();
    }

    const durationSec = durationMs / 1000;

    // Воспроизводим аккорды-пэды, длящиеся всю фазу
    switch (phase) {
      case 'inhale':
        // Вдох: Светлый, расширяющийся аккорд (C Major 9)
        // Частоты: 261.63 (C4), 329.63 (E4), 392.00 (G4), 493.88 (B4), 587.33 (D5) 
        this.playChord([261.63, 329.63, 392.00, 493.88, 587.33], durationSec);
        break;

      case 'inhaleDouble':
        // Довдох: Повторяем аккорд, но добавляем звенящую верхушку (C6) для акцента
        this.playChord([261.63, 329.63, 392.00, 493.88, 587.33, 1046.50], durationSec);
        break;

      case 'hold':
        // Тишина
        break;

      case 'exhale':
        // Выдох: Расслабляющий, заземляющий аккорд (A minor 9)
        // Частоты: 220.00 (A3), 261.63 (C4), 329.63 (E4), 392.00 (G4), 493.88 (B4)
        this.playChord([220.00, 261.63, 329.63, 392.00, 493.88], durationSec); 
        break;

      case 'holdOut':
        // Тишина
        break;
    }
  }

  // Воспроизведение аккорда (ТЕПЛЫЙ ОБЪЕМНЫЙ ПЭД С РЕВЕРБЕРАЦИЕЙ)
  private playChord(frequencies: number[], durationSec: number) {
    const ctx = this.ctx;
    if (!ctx || !this.masterCompressor || !this.reverbNode) return;
    const time = ctx.currentTime;
    
    // Группа аккорда
    const chordGain = ctx.createGain();
    // Громкость сильно снижена для нежного эмбиент-звучания
    chordGain.gain.value = 0.4 / frequencies.length;
    
    // Роутинг: Синтезатор -> ChordGain -> (Compressor + Reverb Node)
    chordGain.connect(this.masterCompressor); 
    chordGain.connect(this.reverbNode);

    frequencies.forEach((frequency, index) => {
      // Идеально чистый тон - Синусоида (Sine)
      const oscBase = ctx.createOscillator();
      oscBase.type = 'sine';
      oscBase.frequency.setValueAtTime(frequency, time);

      // Вторая синусоида (Sub или Октава выше) для мягкого объемного хора
      const oscChorus = ctx.createOscillator();
      oscChorus.type = 'sine';
      oscChorus.frequency.setValueAtTime(frequency * (index % 2 === 0 ? 1 : 0.5) * 1.002, time); 

      const noteGain = ctx.createGain();
      
      // ВАЖНО: Атака начинается мгновенно. 
      // Быстрый выход из нуля (за 0.1с), затем плавный рост, чтобы звук был слышен с первой секунды.
      const attackTime = durationSec * 0.4;
      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(0.2, time + 0.1); 
      noteGain.gain.linearRampToValueAtTime(1.0, time + attackTime);
      
      // Несколько мгновений мягкого "сустейна" на макушке
      noteGain.gain.setTargetAtTime(0.6, time + attackTime, durationSec * 0.2);
      
      const releaseStart = time + durationSec;
      // Акустически правильный релиз (мягкое ассимптотическое затухание до нуля без щелчков)
      noteGain.gain.setTargetAtTime(0, releaseStart, 0.8);

      oscBase.connect(noteGain);
      oscChorus.connect(noteGain);
      noteGain.connect(chordGain);

      oscBase.start(time);
      oscChorus.start(time);
      
      // Даем 5 секунд на полное растворение хвоста перед аппаратным стопом
      const stopTime = releaseStart + 5.0; 
      try {
        oscBase.stop(stopTime);
        oscChorus.stop(stopTime);
      } catch (e) {}
    });
  }
}


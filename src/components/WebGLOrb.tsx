import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Color } from 'three';
// Использование локального шума для генерации 3D геометрии на лету
import { createNoise3D } from 'simplex-noise';
import './WebGLOrb.css';

// Цвета перенесены из CSS переменных для WebGL
const colors = {
  inhale: [new Color('#1BFFFF'), new Color('#2E3192')],
  hold: [new Color('#E94057'), new Color('#8A2387')],
  exhale: [new Color('#38ef7d'), new Color('#11998e')],
  holdOut: [new Color('#38ef7d'), new Color('#11998e')],
  idle: [new Color('#414345'), new Color('#232526')]
};

type WebGLOrbProps = {
  phase: 'idle' | 'inhale' | 'inhaleDouble' | 'hold' | 'exhale' | 'holdOut';
  duration?: number;
};

const BlobMesh = ({ phase, duration = 4000 }: WebGLOrbProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const noise3D = useMemo(() => createNoise3D(), []);

  // Ссылка на DOM-узел ауры для изменения CSS box-shadow в реальном времени (в обход React state)
  const auraRef = useRef<HTMLDivElement | null>(null);

  // Чтобы получить доступ к container изнутри Canvas, придется прокинуть его через событие или контекст,
  // В R3F проще всего изменять document.documentElement стили или передать ref снаружи.
  // Но так как WebGLOrb внутри один, можно использовать поиск по CSS классу или data-атрибуту.
  
  // Базовые параметры геометрии и свечения
  const targetParams = useRef({
    scale: 0.9,
    noiseStrength: 0.1, 
    noiseSpeed: 0.2,
    color1: colors.idle[0].clone(),
    color2: colors.idle[1].clone(),
    glowRadius: 30, // пиксели для CSS drop-shadow
    glowAlpha: 0.15
  });

  const startParams = useRef({
    scale: 0.9,
    noiseStrength: 0.1, 
    noiseSpeed: 0.2,
    color1: colors.idle[0].clone(),
    color2: colors.idle[1].clone(),
    glowRadius: 30,
    glowAlpha: 0.15
  });

  // Текущие параметры для рендера
  const currentParams = useRef({
    scale: 0.9,
    noiseStrength: 0.1, 
    noiseSpeed: 0.2,
    color1: colors.idle[0].clone(),
    color2: colors.idle[1].clone(),
    glowRadius: 30,
    glowAlpha: 0.15
  });

  // Отслеживание времени для идеально плавной анимации ровно "на протяжении всей фазы"
  const phaseStartTime = useRef(performance.now());
  const phaseDuration = useRef(duration);

  useEffect(() => {
    // При смене фазы: текущие параметры становятся стартовыми
    startParams.current = {
      scale: currentParams.current.scale,
      noiseStrength: currentParams.current.noiseStrength,
      noiseSpeed: currentParams.current.noiseSpeed,
      color1: currentParams.current.color1.clone(),
      color2: currentParams.current.color2.clone(),
      glowRadius: currentParams.current.glowRadius,
      glowAlpha: currentParams.current.glowAlpha
    };
    
    phaseStartTime.current = performance.now();
    phaseDuration.current = duration;

    switch(phase) {
      case 'inhale':
        // Вдох: радиальный градиент плавно расширяется (снизили яркость и радиус по просьбе)
        targetParams.current = { scale: 1.25, noiseStrength: 0.15, noiseSpeed: 0.15, color1: colors.inhale[0], color2: colors.inhale[1], glowRadius: 700, glowAlpha: 0.5 };
        break;
      case 'inhaleDouble':
        // Довдох: резкое дополнительное расширение и всплеск свечения
        targetParams.current = { scale: 1.35, noiseStrength: 0.18, noiseSpeed: 0.25, color1: colors.inhale[0], color2: colors.inhale[1], glowRadius: 850, glowAlpha: 0.65 };
        break;
      case 'hold':
        // Пауза (на вдохе)
        targetParams.current = { scale: 1.25, noiseStrength: 0.08, noiseSpeed: 0.02, color1: colors.hold[0], color2: colors.hold[1], glowRadius: 750, glowAlpha: 0.4 };
        break;
      case 'exhale':
        // Выдох: плавное стягивание ауры
        targetParams.current = { scale: 0.8, noiseStrength: 0.12, noiseSpeed: 0.1, color1: colors.exhale[0], color2: colors.exhale[1], glowRadius: 150, glowAlpha: 0.2 };
        break;
      case 'holdOut':
        // Пауза (на выдохе)
        targetParams.current = { scale: 0.8, noiseStrength: 0.04, noiseSpeed: 0.01, color1: colors.holdOut[0], color2: colors.holdOut[1], glowRadius: 80, glowAlpha: 0.1 };
        break;
      case 'idle':
      default:
        targetParams.current = { scale: 0.9, noiseStrength: 0.1, noiseSpeed: 0.05, color1: colors.idle[0], color2: colors.idle[1], glowRadius: 150, glowAlpha: 0.2 };
        break;
    }
  }, [phase, duration]);

  // Накопитель времени для плавности шума независимого от изменения скорости
  const accumulatedTime = useRef(0);

  // Функция easing (InOutSine) для равномерного плавного старта и завершения, 
  // занимающего ВСЮ длительность фазы (в отличие от слишком "крутой" Cubic).
  const easeInOutSine = (x: number): number => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  };

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Считаем точный прогресс фазы (от 0 до 1)
    const now = performance.now();
    const elapsedTime = now - phaseStartTime.current;
    let rawProgress = Math.min(elapsedTime / phaseDuration.current, 1.0);
    
    // Применяем мягкое сглаживание Sine (ровно на протяжении всей фазы)
    const progress = easeInOutSine(rawProgress);

    // Строгая интерполяция всех параметров от старта до таргета
    currentParams.current.scale = THREE.MathUtils.lerp(startParams.current.scale, targetParams.current.scale, progress);
    currentParams.current.noiseStrength = THREE.MathUtils.lerp(startParams.current.noiseStrength, targetParams.current.noiseStrength, progress);
    currentParams.current.noiseSpeed = THREE.MathUtils.lerp(startParams.current.noiseSpeed, targetParams.current.noiseSpeed, progress);
    currentParams.current.glowRadius = THREE.MathUtils.lerp(startParams.current.glowRadius, targetParams.current.glowRadius, progress);
    currentParams.current.glowAlpha = THREE.MathUtils.lerp(startParams.current.glowAlpha, targetParams.current.glowAlpha, progress);
    
    currentParams.current.color1.copy(startParams.current.color1).lerp(targetParams.current.color1, progress);
    currentParams.current.color2.copy(startParams.current.color2).lerp(targetParams.current.color2, progress);

    // Применяем масштаб к 3D объекту
    meshRef.current.scale.setScalar(currentParams.current.scale);

    // Применяем CSS свечение к фоновой ауре (чистый радиальный градиент + scale + мягкий opacity)
    if (!auraRef.current) auraRef.current = document.querySelector('.orb-aura');
    if (auraRef.current) {
      const col = currentParams.current.color1;
      const rgb = `${Math.round(col.r*255)}, ${Math.round(col.g*255)}, ${Math.round(col.b*255)}`;
      // Используем rgba(..., 0) вместо transparent для избежания темных артефактов в Safari
      auraRef.current.style.background = `radial-gradient(circle, rgba(${rgb}, ${currentParams.current.glowAlpha}) 0%, rgba(${rgb}, 0) 70%)`;
      // Увеличиваем масштаб ауры, базовый размер 200x200
      const auraScale = Math.max(0.1, currentParams.current.glowRadius / 100);
      auraRef.current.style.transform = `translate(-50%, -50%) scale(${auraScale})`;
    }

    // Накапливаем время с учетом текущей плавной скорости (убирает баг "скачка" при изменении noiseSpeed)
    accumulatedTime.current += delta * currentParams.current.noiseSpeed;
    const time = accumulatedTime.current;

    // Математический 3D морфинг (Lava Lamp / Bio-form effect)
    // Мы деформируем вершины сферы с помощью Simplex шума
    const geometry = meshRef.current.geometry as THREE.SphereGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    
    // В React Three Fiber лучше не изменять геометрию каждый кадр вручную без шейдеров, 
    // но для простого эффекта метабола на ~256 вершинах это работает очень быстро и выглядит отлично.
    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        // Сбрасываем длину вектора к базовому радиусу (например, 2)
        vertex.normalize().multiplyScalar(2);
        
        // Получаем шум для данной точки в 3D пространстве с учетом времени
        const noise = noise3D(vertex.x * 0.5 + time, vertex.y * 0.5 + time, vertex.z * 0.5);
        
        // Сдвигаем вершину по ее нормали
        vertex.multiplyScalar(1 + noise * currentParams.current.noiseStrength);
        
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    // Обновляем Shader
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uColor1.value = currentParams.current.color1;
    materialRef.current.uniforms.uColor2.value = currentParams.current.color2;
  });

  // Пользовательский шейдер для красивого размытого градиентного свечения и эффекта "пустого стекла/ауры"
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      // Имитация освещения Френеля для эффекта объема "мягкой материи"
      float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 2.0);
      
      // Плавный градиент по вертикали + легкая анимация волнами
      float mixValue = vUv.y + sin(vUv.x * 10.0 + uTime) * 0.1;
      vec3 color = mix(uColor1, uColor2, mixValue);
      
      // Добавляем эффект Френеля (свечение по краям)
      color += fresnel * 0.5;
      
      // Выводим с учетом прозрачности по краям для "размытости"
      gl_FragColor = vec4(color, 0.8 + fresnel * 0.2);
    }
  `;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(colors.idle[0]) },
    uColor2: { value: new THREE.Color(colors.idle[1]) }
  }), []);

  return (
    <mesh ref={meshRef}>
      {/* Сфера с большим количеством сегментов для плавного морфинга */}
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export const WebGLOrb = ({ phase, duration }: WebGLOrbProps) => {
  return (
    <>
      <div className="orb-aura"></div>
      <div className="webgl-orb-container">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <BlobMesh phase={phase} duration={duration} />
        </Canvas>
      </div>
    </>
  );
};


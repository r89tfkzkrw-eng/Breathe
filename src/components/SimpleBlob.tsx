import { motion } from 'framer-motion';

type SimpleBlobProps = {
  phase: string;
};

export function SimpleBlob({ phase }: SimpleBlobProps) {
  const getOrbState = () => {
    switch (phase) {
      case 'inhale':
        return {
          scale: 1,
          background: 'linear-gradient(135deg, var(--orb-breathe-in-color-1), var(--orb-breathe-in-color-2))',
          boxShadow: '0 0 100px 20px rgba(27, 255, 255, 0.2)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        };
      case 'hold':
        return {
          scale: 1.05,
          background: 'linear-gradient(135deg, var(--orb-hold-color-1), var(--orb-hold-color-2))',
          boxShadow: '0 0 120px 30px rgba(233, 64, 87, 0.3)',
          borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
        };
      case 'exhale':
        return {
          scale: 0.4,
          background: 'linear-gradient(135deg, var(--orb-breathe-out-color-1), var(--orb-breathe-out-color-2))',
          boxShadow: '0 0 60px 10px rgba(56, 239, 125, 0.1)',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        };
      case 'holdOut':
        return {
          scale: 0.35,
          background: 'linear-gradient(135deg, var(--orb-breathe-out-color-1), var(--orb-breathe-out-color-2))',
          boxShadow: '0 0 40px 5px rgba(56, 239, 125, 0.05)',
          borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
        };
      case 'idle':
      default:
        return {
          scale: 0.5,
          background: 'linear-gradient(135deg, var(--orb-idle-color-1), var(--orb-idle-color-2))',
          boxShadow: '0 0 30px 5px rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        };
    }
  };

  return (
    <motion.div
      animate={getOrbState()}
      transition={{
        duration: phase === 'idle' ? 2 : 4,
        ease: "easeInOut",
      }}
      style={{
        width: '300px',
        height: '300px',
        filter: 'blur(8px)',
      }}
    />
  );
}

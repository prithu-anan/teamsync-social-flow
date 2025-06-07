import React, { useMemo } from 'react';

const NUM_BUBBLES = 40;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const WaterBackground: React.FC = () => {
  // Generate bubble configs only once
  const bubbles = useMemo(() => {
    return Array.from({ length: NUM_BUBBLES }).map((_, i) => {
      const size = randomBetween(18, 48); // px
      const left = randomBetween(0, 100); // %
      const duration = randomBetween(6, 16); // seconds
      const delay = randomBetween(0, 10); // seconds
      const opacity = randomBetween(0.15, 0.35);
      return { size, left, duration, delay, opacity, key: i };
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Water gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-500 animate-water-bg" />
      {/* Bubbles */}
      {bubbles.map(bubble => (
        <div
          key={bubble.key}
          className="absolute pointer-events-none bubble-anim"
          style={{
            left: `${bubble.left}%`,
            width: bubble.size,
            height: bubble.size,
            opacity: bubble.opacity,
            bottom: `-${bubble.size * 1.2}px`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        >
          {/* Bubble with border and shiny spot */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid rgba(120,170,255,0.45)',
              background: 'radial-gradient(circle at 65% 30%, rgba(255,255,255,0.85) 0%, rgba(180,210,255,0.18) 30%, rgba(120,170,255,0.10) 60%, rgba(120,170,255,0.04) 100%)',
              boxShadow: '0 2px 16px 0 rgba(120,170,255,0.18), 0 0 8px 2px rgba(120,170,255,0.10)',
              position: 'relative',
            }}
          >
            {/* Shiny spot */}
            <div
              style={{
                position: 'absolute',
                top: '16%',
                left: '20%',
                width: '32%',
                height: '20%',
                background: 'rgba(255,255,255,0.85)',
                borderRadius: '50%',
                filter: 'blur(1.2px)',
                opacity: 0.85,
              }}
            />
          </div>
        </div>
      ))}
      <style jsx global>{`
        @keyframes bubbleUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.2;
          }
          10% {
            opacity: 0.4;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) scale(1.1);
            opacity: 0;
          }
        }
        .bubble-anim {
          animation-name: bubbleUp;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .animate-water-bg {
          animation: waterGradient 18s ease-in-out infinite alternate;
        }
        @keyframes waterGradient {
          0% { filter: blur(0px) brightness(0.97); }
          100% { filter: blur(2px) brightness(1.03); }
        }
      `}</style>
    </div>
  );
};

export default WaterBackground; 
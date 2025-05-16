import { useState, useEffect } from 'react';

const CardSuitsBackground = () => {
  const [suits, setSuits] = useState([]);
  
  useEffect(() => {
    // Card suit characters
    const suitTypes = ['♠', '♥', '♦', '♣'];
    const bgSuits = [];
    
    // Generate a good number of suits for the background
    for (let i = 0; i < 80; i++) {
      const suitType = suitTypes[Math.floor(Math.random() * suitTypes.length)];
      
      bgSuits.push({
        id: i,
        type: suitType,
        x: `${Math.random() * 100}vw`,
        y: `${Math.random() * 100}vh`,
        size: `${Math.random() * 2 + 1.5}rem`,
        duration: `${Math.random() * 15 + 20}s`,
        delay: `-${Math.random() * 20}s`,
        opacity: Math.random() * 0.15 + 0.05,
        rotation: Math.floor(Math.random() * 360),
      });
    }
    
    setSuits(bgSuits);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {suits.map((suit) => (
        <div
          key={suit.id}
          style={{
            position: 'absolute',
            left: suit.x,
            top: suit.y,
            fontSize: suit.size,
            color: 'black',
            opacity: suit.opacity,
            transform: `rotate(${suit.rotation}deg)`,
            animation: `suitFloat ${suit.duration} infinite ease-in-out ${suit.delay}`,
          }}
        >
          {suit.type}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes suitFloat {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(10px, 10px) rotate(5deg);
          }
          50% {
            transform: translate(0, 20px) rotate(0deg);
          }
          75% {
            transform: translate(-10px, 10px) rotate(-5deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CardSuitsBackground;
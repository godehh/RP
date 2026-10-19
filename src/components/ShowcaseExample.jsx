import React, { useState } from 'react';
import SpecularButton from './SpecularButton';
import BounceCards from './BounceCards';

const sampleImages = [
  'assets/images/products/protein-health-mix-1.jpg',
  'assets/images/products/poondu-podi-1.jpg',
  'assets/images/products/millet-mix-1.jpg',
  'assets/images/products/pirandai-podi-1.jpg',
  'assets/images/products/sundakkai-podi-1.jpg'
];

export default function ShowcaseExample() {
  const [clickedCard, setClickedCard] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem', padding: '4rem 1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#166534' }}>
          🌿 RP Organics Collection
        </h2>
        <p style={{ color: '#64748b' }}>
          Interactive BounceCards fan with physics springs and hover spread
        </p>
      </div>

      <BounceCards
        images={sampleImages}
        containerWidth={520}
        containerHeight={320}
        cardSize={200}
        spread={85}
        rotation={10}
        arc={0}
        pushDistance={160}
        hoverScale={1.06}
        bounciness={0.6}
        animationDelay={0.3}
        animationStagger={0.06}
        borderWidth={4}
        borderColor="#ffffff"
        radius={22}
        shadow
        enableHover
        onCardClick={(index) => {
          setClickedCard(index);
          console.log('Selected card:', index);
        }}
      />

      {clickedCard !== null && (
        <p style={{ color: '#15803d', fontWeight: 600 }}>
          Selected Product Card: #{clickedCard + 1}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <SpecularButton
          size="lg"
          radius={18}
          tint="#235328"
          tintOpacity={0.88}
          textColor="#ffffff"
          lineColor="#86efac"
          baseColor="#14532d"
          intensity={1}
          idleIntensity={0.4}
          shineSize={12}
          shineFade={36}
          thickness={1.4}
          glow={1}
          followMouse
          proximity={260}
          onClick={() => {
            window.location.href = 'shop.html';
          }}
        >
          Explore All Products &rarr;
        </SpecularButton>

        <SpecularButton
          size="lg"
          radius={18}
          tint="#c05621"
          tintOpacity={0.9}
          textColor="#ffffff"
          lineColor="#fed7aa"
          baseColor="#7c2d12"
          intensity={1}
          idleIntensity={0.35}
          shineSize={10}
          shineFade={34}
          thickness={1.2}
          glow={1}
          followMouse
          autoAnimate
          speed={0.4}
          proximity={250}
          onClick={() => {
            window.location.href = 'product.html?id=pro-01';
          }}
        >
          Order Health Mix (15% OFF)
        </SpecularButton>
      </div>
    </div>
  );
}

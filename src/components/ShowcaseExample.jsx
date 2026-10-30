import React, { useState } from 'react';
import SpecularButton from './SpecularButton';
import BounceCards from './BounceCards';
import Antigravity from './Antigravity';
import GooeyNav from './GooeyNav';

const sampleImages = [
  'assets/images/products/protein-health-mix-1.jpg',
  'assets/images/products/poondu-podi-1.jpg',
  'assets/images/products/millet-mix-1.jpg',
  'assets/images/products/pirandai-podi-1.jpg',
  'assets/images/products/sundakkai-podi-1.jpg'
];

const navItems = [
  { label: 'Home', href: '#' },
  { label: 'Shop All', href: '#' },
  { label: 'Health Mix', href: '#' },
  { label: 'Herbal Podis', href: '#' },
  { label: 'About Us', href: '#' }
];

const ORGANIC_PALETTE = ['#16a34a', '#86efac', '#d97706', '#22c55e'];
const BW_PALETTE = ['#ffffff', '#e2e8f0', '#94a3b8', '#475569', '#0f172a'];

export default function ShowcaseExample() {
  const [clickedCard, setClickedCard] = useState(null);
  const [isBwTheme, setIsBwTheme] = useState(false);
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: isBwTheme ? '#09090b' : '#f8fafc', transition: 'background 0.4s ease' }}>
      {/* Antigravity particle backdrop */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.85, pointerEvents: 'none' }}>
        <Antigravity
          colors={isBwTheme ? BW_PALETTE : ORGANIC_PALETTE}
          count={1200}
          magnetRadius={8.5}
          ringRadius={6.5}
          particleSize={0.85}
          autoAnimate={true}
          interactive={true}
          clickBurst={true}
          lightMode={!isBwTheme}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', padding: '4rem 1rem' }}>
        {/* GooeyNav primary navigation */}
        <GooeyNav
          items={navItems}
          initialActiveIndex={activeNav}
          theme={isBwTheme ? 'dark' : 'light'}
          color={isBwTheme ? '#3f3f46' : '#15803d'}
          colors={isBwTheme ? ['#ffffff', '#a1a1aa', '#71717a'] : ['#16a34a', '#86efac', '#22c55e']}
          size="md"
          frame={true}
          particleCount={16}
          spread={60}
          gooeyness={0.55}
          wobble={0.5}
          onChange={(index) => setActiveNav(index)}
        />

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: isBwTheme ? '#f8fafc' : '#166534' }}>
            🌿 RP Organics Interactive Experience
          </h2>
          <p style={{ color: isBwTheme ? '#94a3b8' : '#64748b' }}>
            Interactive GooeyNav + Antigravity particles background + physics BounceCards
          </p>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => setIsBwTheme(!isBwTheme)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: isBwTheme ? '1px solid #52525b' : '1px solid #16a34a',
                background: isBwTheme ? '#27272a' : '#ecfdf5',
                color: isBwTheme ? '#fafafa' : '#15803d',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {isBwTheme ? '🎨 Switch to Organic Theme' : '🌓 Switch to Black & White Theme'}
            </button>
          </div>
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
          <p style={{ color: isBwTheme ? '#38bdf8' : '#15803d', fontWeight: 600 }}>
            Selected Product Card: #{clickedCard + 1}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <SpecularButton
            size="lg"
            radius={18}
            tint={isBwTheme ? '#3f3f46' : '#235328'}
            tintOpacity={0.88}
            textColor="#ffffff"
            lineColor={isBwTheme ? '#ffffff' : '#86efac'}
            baseColor={isBwTheme ? '#18181b' : '#14532d'}
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
            tint={isBwTheme ? '#52525b' : '#c05621'}
            tintOpacity={0.9}
            textColor="#ffffff"
            lineColor={isBwTheme ? '#d4d4d8' : '#fed7aa'}
            baseColor={isBwTheme ? '#27272a' : '#7c2d12'}
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
    </div>
  );
}


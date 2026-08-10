import { INK, TERRA, BONE } from '../../data/trip.js';

export default function CityMap({ points }) {
  const grid = [];
  for (let i = 1; i < 8; i++) grid.push(<line key={'v' + i} x1={i * 12.5 + '%'} y1={0} x2={i * 12.5 + '%'} y2="100%" stroke="#ddd5c4" strokeWidth="1" />);
  for (let i = 1; i < 4; i++) grid.push(<line key={'h' + i} x1={0} y1={i * 25 + '%'} x2="100%" y2={i * 25 + '%'} stroke="#ddd5c4" strokeWidth="1" />);

  const path = 'M' + points.map((p) => `${p.x} ${p.y}`).join(' L');

  return (
    <>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="100" height="100" fill="#eae4d6" />
        <g style={{ opacity: 0.5 }}>{grid}</g>
        <path d="M0 70 L22 48 L40 66 L58 34 L78 60 L100 44 L100 100 L0 100 Z" fill="#dfe6e4" opacity="0.8" />
        <path d={path} fill="none" stroke={INK} strokeWidth="1.2" strokeDasharray="3.5 2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {points.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', left: p.x + '%', top: p.y + '%',
            width: p.on ? 13 : 10, height: p.on ? 13 : 10,
            marginLeft: p.on ? -6.5 : -5, marginTop: p.on ? -6.5 : -5,
            borderRadius: '50%', background: p.on ? TERRA : BONE,
            border: `1.5px solid ${INK}`, boxSizing: 'border-box',
          }}
        />
      ))}
    </>
  );
}

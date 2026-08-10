import { AIRPORTS, INK, TERRA, BONE } from '../../data/trip.js';

const ORDER = ['SJD', 'MEX', 'LHR', 'MUC'];

export default function JourneyMap() {
  const grid = [];
  for (let i = 1; i < 8; i++) grid.push(<line key={'v' + i} x1={i * 12.5 + '%'} y1={0} x2={i * 12.5 + '%'} y2="100%" stroke="#ddd5c4" strokeWidth="1" />);
  for (let i = 1; i < 6; i++) grid.push(<line key={'h' + i} x1={0} y1={i * 16.6 + '%'} x2="100%" y2={i * 16.6 + '%'} stroke="#ddd5c4" strokeWidth="1" />);

  const path = [['SJD', 'MEX'], ['MEX', 'LHR'], ['LHR', 'MUC']]
    .map(([a, b]) => `M${AIRPORTS[a].x} ${AIRPORTS[a].y} L${AIRPORTS[b].x} ${AIRPORTS[b].y}`)
    .join(' ');

  return (
    <>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect width="100" height="100" fill="#eae4d6" />
        <g style={{ opacity: 0.5 }}>{grid}</g>
        <path d="M0 46 L16 44 L30 52 L44 40 L58 44 L74 38 L100 44 L100 100 L0 100 Z" fill="#dfe6e4" opacity="0.7" />
        <path d={path} fill="none" stroke={INK} strokeWidth="1.2" strokeDasharray="3.5 2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {ORDER.map((code) => {
        const p = AIRPORTS[code];
        return (
          <span key={code} style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: TERRA, border: `2px solid ${BONE}`, boxSizing: 'border-box', flex: 'none' }} />
            <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: INK, background: 'rgba(250,248,244,.85)', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>{code}</span>
          </span>
        );
      })}
      <span className="mono" style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Schematic — drop a real map here
      </span>
    </>
  );
}

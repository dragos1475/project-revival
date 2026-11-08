import { CAT } from '../content/lw';
import { COUNTY_PATHS, DANUBE_PATH, projectPoint, ROMANIA_PATH, WELCOME_POINTS, pointTime } from '../content/welcome-data';
import { pick } from '../i18n/core';

export function WelcomeMap({ elapsed }: { elapsed: number }) {
  return <div className="welcome-map">
    <div className="welcome-map-heading"><span>{pick('O REȚEA. O ȚARĂ. UN VIITOR.', 'ONE NETWORK. ONE COUNTRY. ONE FUTURE.')}</span><span>RO / {WELCOME_POINTS.length}</span></div>
    <svg viewBox="0 0 660 470" role="img" aria-label={pick('Rețeaua reală LifeWatch România, cu Dunărea și punctele de cercetare', 'The LifeWatch Romania network, with the Danube and research locations')}>
      <defs><clipPath id="welcome-country-clip"><path d={ROMANIA_PATH} /></clipPath></defs>
      <g className="welcome-counties" clipPath="url(#welcome-country-clip)">{COUNTY_PATHS.map((d, i) => <path key={i} d={d} />)}</g>
      <path className="welcome-outline" d={ROMANIA_PATH} pathLength={1} />
      <path className="welcome-danube" d={DANUBE_PATH} pathLength={1} clipPath="url(#welcome-country-clip)" />
      {WELCOME_POINTS.map((p, i) => {
        const [x, y] = projectPoint(p.lon, p.lat);
        const shape = CAT[p.cat].shape;
        return <g key={p.key} transform={`translate(${x} ${y})`} className={`welcome-point welcome-cat-${p.cat}`} data-visible={elapsed >= pointTime(i)}>
          <title data-no-tr>{p.ro}</title>
          {shape === 'square' ? <rect x={-4} y={-4} width={8} height={8} /> : shape === 'triangle' ? <path d="M0 -5 L5 4 L-5 4 Z" /> : shape === 'diamond' ? <path d="M0 -4 L4 0 L0 4 L-4 0 Z" /> : <circle r={4} />}
        </g>;
      })}
      <text x="330" y="162" className="welcome-map-label" data-no-tr>{pick('ROMÂNIA', 'ROMANIA')}</text>
      <text x="270" y="400" className="welcome-river-label" data-no-tr>{pick('Dunărea', 'Danube')}</text>
    </svg>
    <div className="welcome-map-foot"><span>{pick('De la Carpați la Delta Dunării', 'From the Carpathians to the Danube Delta')}</span><span>43°–49° N / 20°–30° E</span></div>
  </div>;
}
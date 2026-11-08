import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WelcomeMap } from '../components/welcome-map';
import { asset } from '../content/lw';
import { LOGOS, sitePhoto } from '../content/site-photos';
import { ENTRY_DELAY, INTRO_DURATION, visibleCounts, WELCOME_GROUPS } from '../content/welcome-data';
import { getLang, pick } from '../i18n/core';
import { explorerHref, hrefIn, Link } from '../router';

const PHOTOS = [sitePhoto('47c58b77'), sitePhoto('00c041bf'), sitePhoto('9dcd0bec')];

export default function WelcomePage() {
  const [elapsed, setElapsed] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLElement>(null);
  const complete = elapsed >= INTRO_DURATION;
  const counts = visibleCounts(elapsed);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setReduced(media.matches); if (media.matches) setElapsed(INTRO_DURATION); };
    sync();
    media.addEventListener('change', sync);
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setElapsed(INTRO_DURATION); };
    window.addEventListener('keydown', key);
    return () => { media.removeEventListener('change', sync); window.removeEventListener('keydown', key); };
  }, []);

  useEffect(() => {
    if (reduced || complete) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setElapsed(INTRO_DURATION); return; }
      const value = Math.min(INTRO_DURATION, now - start);
      setElapsed(value);
      if (value < INTRO_DURATION) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, reduced, complete]);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => setPhoto(p => (p + 1) % PHOTOS.length), 10000);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => root.current?.style.setProperty('--welcome-parallax', `${Math.min(window.scrollY * 0.12, 70)}px`));
    };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { window.removeEventListener('scroll', scroll); cancelAnimationFrame(frame); };
  }, [reduced]);

  return <main ref={root} className="welcome" data-complete={complete} data-reduced={reduced} data-paused={paused}>
    <section className="welcome-stage" aria-label={pick('Bun venit la LifeWatch România', 'Welcome to LifeWatch Romania')}>
      <div className="welcome-photos" aria-hidden="true">{PHOTOS.map((p, i) => <img key={p.src} src={asset(p.src)} alt="" className={photo === i ? 'is-active' : ''} loading={i ? 'lazy' : 'eager'} />)}</div>
      <div className="welcome-shade" /><div className="welcome-grain" aria-hidden="true" />
      <header className="welcome-header">
        <span className="welcome-wordmark">LifeWatch <span data-no-tr>{pick('România', 'Romania')}</span></span>
        <div className="welcome-header-actions">
          <nav aria-label={pick('Limba paginii', 'Page language')}><a href={hrefIn('', 'ro')} aria-current={getLang() === 'ro' ? 'page' : undefined}>RO</a><span>/</span><a href={hrefIn('', 'en')} aria-current={getLang() === 'en' ? 'page' : undefined}>EN</a></nav>
          {!complete ? <Button variant="ghost" className="welcome-skip" onClick={() => setElapsed(INTRO_DURATION)}>{pick('Sari peste', 'Skip intro')} <ArrowRight /></Button> : <Button variant="ghost" size="icon" className="welcome-icon" aria-label={pick('Reia introducerea', 'Replay introduction')} title={pick('Reia introducerea', 'Replay introduction')} onClick={() => { setElapsed(0); setRun(r => r + 1); }}><RotateCcw /></Button>}
        </div>
      </header>
      <div className="welcome-content" key={run}>
        <div className="welcome-editorial">
          <svg className="welcome-wave" viewBox="0 0 120 55" aria-hidden="true"><path className="wave-lime" d="M5 35 C23 12 40 12 58 35 S93 58 115 30" pathLength={1} /><path className="wave-light" d="M18 17 C32 3 45 3 59 17 S86 31 102 14" pathLength={1} /></svg>
          <p className="welcome-eyebrow">{pick('INFRASTRUCTURĂ DE CERCETARE', 'RESEARCH INFRASTRUCTURE')}</p>
          <h1 className="welcome-title">LifeWatch<br /><span data-no-tr>{pick('România', 'Romania')}</span><span className="welcome-title-dot">.</span></h1>
          <p className="welcome-university">{pick('Universitatea din București', 'University of Bucharest')}</p>
          <p className="welcome-lede">{pick('Înțelegem natura. Conectăm datele.', 'Understanding nature. Connecting data.')}<br />{pick('De la observația din teren la știința unui viitor sustenabil.', 'From observations in the field to the science of a sustainable future.')}</p>
          <div className="welcome-entries" data-ready={elapsed >= ENTRY_DELAY} inert={elapsed < ENTRY_DELAY}>
            <Button asChild variant="lime" className="welcome-enter"><Link to="acasa">{pick('Descoperă LifeWatch România', 'Discover LifeWatch Romania')} <ArrowRight /></Link></Button>
            <Button asChild variant="ghost" className="welcome-explore"><a href={explorerHref()}>{pick('Explorează datele', 'Explore the data')} <ArrowUpRight /></a></Button>
          </div>
        </div>
        <WelcomeMap elapsed={elapsed} />
      </div>
      <div className="welcome-stats" aria-label={pick('Rețeaua în cifre', 'Network in numbers')}>{WELCOME_GROUPS.map((g, i) => <div key={g.label}><span className="welcome-stat-value">{String(counts[i]).padStart(2, '0')}</span><span>{pick(g.label, g.en)}</span></div>)}</div>
      <footer className="welcome-stage-footer">
        <div className="welcome-caption"><span className="welcome-caption-line" /><div><p data-no-tr>{PHOTOS[photo].alt}</p><span data-no-tr>© {PHOTOS[photo].credit}</span></div></div>
        <div className="welcome-photo-controls"><span>{String(photo + 1).padStart(2, '0')} <span>/ {String(PHOTOS.length).padStart(2, '0')}</span></span>{!reduced && <Button variant="ghost" size="icon" className="welcome-icon" onClick={() => setPaused(p => !p)} aria-label={paused ? pick('Pornește fotografiile', 'Play photos') : pick('Oprește fotografiile', 'Pause photos')} title={paused ? pick('Pornește fotografiile', 'Play photos') : pick('Oprește fotografiile', 'Pause photos')}>{paused ? <Play /> : <Pause />}</Button>}</div>
      </footer>
    </section>
    <section className="welcome-partners" aria-label={pick('Instituții și rețele partenere', 'Partner institutions and networks')}>
      <span className="welcome-partner-label">{pick('CERCETARE FĂRĂ GRANIȚE', 'RESEARCH WITHOUT BORDERS')}</span>
      <a href="https://unibuc.ro/" target="_blank" rel="noreferrer"><img src={asset(LOGOS.ub.src)} alt={LOGOS.ub.alt} /></a>
      <a href="https://www.lifewatch.eu/" target="_blank" rel="noreferrer" className="welcome-partner-type">LifeWatch <small>ERIC</small></a>
      <a href="https://elter-ri.eu/" target="_blank" rel="noreferrer" className="welcome-partner-type">eLTER <small>RESEARCH INFRASTRUCTURE</small></a>
      <a href="https://www.icos-cp.eu/" target="_blank" rel="noreferrer" className="welcome-partner-type">ICOS <small>CARBON OBSERVATION SYSTEM</small></a>
      <a href="https://www.danubius-ri.eu/" target="_blank" rel="noreferrer" className="welcome-partner-type">DANUBIUS <small>RESEARCH INFRASTRUCTURE</small></a>
    </section>
  </main>;
}
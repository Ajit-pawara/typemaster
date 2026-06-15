import React, { useEffect, useState } from 'react';

interface AdUnitProps {
  type: 'banner' | 'sidebar' | 'dashboard-native' | 'inter-test';
  slotId?: string;
}

interface MockAd {
  title: string;
  desc: string;
  cta: string;
  url: string;
  logo: string;
  logoColor: string;
}

const MOCK_ADS: MockAd[] = [
  {
    title: 'Vercel',
    desc: 'Deploy your Astro and React apps in seconds with absolute global scale.',
    cta: 'Deploy Now',
    url: 'https://vercel.com',
    logo: '▲',
    logoColor: 'text-white bg-black',
  },
  {
    title: 'MongoDB Atlas',
    desc: 'The multi-cloud developer database. Register now and receive $100 free credit.',
    cta: 'Start Free',
    url: 'https://mongodb.com',
    logo: '🍃',
    logoColor: 'text-[#00ed64] bg-[#001e2b]',
  },
  {
    title: 'Tailwind CSS v4.0',
    desc: 'A multi-pass CSS compiler built for high performance. Zero configuration.',
    cta: 'Get Started',
    url: 'https://tailwindcss.com',
    logo: '⚡',
    logoColor: 'text-cyan-400 bg-slate-900',
  },
  {
    title: 'TypeMaster Pro',
    desc: 'Unlock detailed key analysis, dark mode theme styles, and go completely ad-free.',
    cta: 'Go Pro — $4/mo',
    url: '#',
    logo: '👑',
    logoColor: 'text-amber-400 bg-zinc-900',
  }
];

export const AdUnit: React.FC<AdUnitProps> = ({ type, slotId: _slotId }) => {
  const [ad, setAd] = useState<MockAd | null>(null);

  useEffect(() => {
    // Select a random mock ad
    const randomAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
    setAd(randomAd);

    // In a real environment, we would trigger Google AdSense pushes here:
    // try {
    //   ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    // } catch (e) {
    //   console.error(e);
    // }
  }, [type]);

  if (!ad) return null;

  // Render high-fidelity mock developer ads that perfectly match the Vercel-style UI
  if (type === 'banner') {
    return (
      <div className="w-full py-4 border-y border-hairline my-6 bg-canvas-soft flex items-center justify-between px-6 rounded-md shadow-level-1 relative overflow-hidden">
        <span className="absolute top-0 right-0 text-[8px] font-mono text-mute bg-hairline px-1 rounded-bl">ADVERTISEMENT</span>
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${ad.logoColor}`}>
            {ad.logo}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink flex items-center">
              {ad.title}
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-brand-cyan/30 text-brand-cyan bg-brand-cyan-soft font-mono">Sponsored</span>
            </h4>
            <p className="text-xs text-body line-clamp-1">{ad.desc}</p>
          </div>
        </div>
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-ink text-canvas text-xs font-medium rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="w-full p-4 border border-hairline bg-canvas-soft rounded-lg shadow-level-2 flex flex-col justify-between aspect-square max-w-[280px] relative">
        <span className="absolute top-0 right-0 text-[8px] font-mono text-mute bg-hairline px-1 rounded-bl">ADVERTISEMENT</span>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-sm ${ad.logoColor}`}>
              {ad.logo}
            </div>
            <h4 className="text-xs font-semibold text-ink">{ad.title}</h4>
            <span className="text-[9px] px-1 py-0.2 rounded border border-hairline text-mute bg-canvas-soft-2 font-mono">Ad</span>
          </div>
          <p className="text-xs text-body leading-relaxed">{ad.desc}</p>
        </div>
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 py-1.5 bg-ink text-canvas text-xs font-medium rounded-full hover:opacity-90 transition-opacity text-center block"
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  if (type === 'dashboard-native') {
    return (
      <div className="w-full p-6 border border-hairline bg-canvas-soft rounded-lg shadow-level-3 flex flex-col md:flex-row items-center justify-between relative">
        <span className="absolute top-0 right-0 text-[8px] font-mono text-mute bg-hairline px-1 rounded-bl">SPONSORED RESOURCING</span>
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-2xl ${ad.logoColor} shrink-0`}>
            {ad.logo}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink flex items-center">
              {ad.title}
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-brand-violet/30 text-brand-violet bg-brand-violet-soft font-mono">Partner SDK</span>
            </h4>
            <p className="text-xs text-body leading-relaxed max-w-xl">{ad.desc}</p>
          </div>
        </div>
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-hairline hover:bg-canvas-soft-2 text-ink text-xs font-medium rounded-full transition-colors whitespace-nowrap"
        >
          {ad.cta}
        </a>
      </div>
    );
  }

  // Interstitial ad between test transitions (does not block active typing)
  return (
    <div className="w-full max-w-lg p-6 border border-hairline bg-canvas-soft rounded-lg shadow-level-4 mx-auto my-6 text-center relative">
      <span className="absolute top-0 right-0 text-[8px] font-mono text-mute bg-hairline px-1 rounded-bl">SPONSORED BREAK</span>
      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-3 ${ad.logoColor}`}>
        {ad.logo}
      </div>
      <h3 className="text-md font-semibold text-ink mb-1">{ad.title}</h3>
      <p className="text-xs text-body leading-relaxed mb-4 max-w-md mx-auto">{ad.desc}</p>
      <div className="flex items-center justify-center space-x-3">
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-1.5 bg-ink text-canvas text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          {ad.cta}
        </a>
      </div>
    </div>
  );
};
export default AdUnit;

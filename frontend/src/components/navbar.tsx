'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Logo } from './logo';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export function Navbar() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const lastScrollRef = useRef(0);
  const tickingRef = useRef(false);
  const clickAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch(`${BACKEND}/user/me`, { credentials: 'include' })
      .then((r) => setIsAuthed(r.ok))
      .catch(() => setIsAuthed(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const last = lastScrollRef.current;
        if (Math.abs(current - last) > 8) {
          setHideNav(current > last && current > 64);
          lastScrollRef.current = current;
        }
        tickingRef.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }
  };

  if (pathname === '/auth' || pathname?.startsWith('/auth/')) return null;

  return (
    <>
      <audio
        ref={clickAudioRef}
        src="/button-click.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />
      <nav
        className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30 select-none transition-transform duration-300 ease-out ${
          hideNav ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ background: 'transparent' }}
      >
        <Logo />
        {isAuthed ? (
          <Link href="/profile">
            <Button
              size="sm"
              className="relative ml-4 rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              onClick={playClick}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600/70 via-cyan-500/70 to-fuchsia-500/70 backdrop-blur-md" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
              <span className="relative flex items-center gap-1">
                <span className="text-xs opacity-70">🚀</span> Profile
              </span>
            </Button>
          </Link>
        ) : (
          <Link href="/auth">
            <Button
              size="sm"
              className="relative ml-4 rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              onClick={playClick}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/70 via-pink-500/70 to-indigo-500/70 backdrop-blur-md" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.35),transparent_60%)]" />
              <span className="relative flex items-center gap-1">
                <span className="text-xs opacity-70">✨</span> Sign In
              </span>
            </Button>
          </Link>
        )}
      </nav>
    </>
  );
}

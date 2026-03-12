'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

const FALLBACK_CHAIN = [
  '/brand/zoey-neutral.png',
  '/brand/zoey-corgi.svg',
] as const;

interface ZoeyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackText?: string;
  fallbackChain?: string[];
  'data-testid'?: string;
}

function inferBasePath(): string {
  if (typeof window === 'undefined') return '';

  const nextData = (window as Window & { __NEXT_DATA__?: { assetPrefix?: string; basePath?: string } }).__NEXT_DATA__;
  const fromNextData = nextData?.assetPrefix || nextData?.basePath || '';
  if (fromNextData && fromNextData.startsWith('/')) return fromNextData.replace(/\/$/, '');

  const nextScript = document.querySelector('script[src*="/_next/"]') as HTMLScriptElement | null;
  if (nextScript?.src) {
    try {
      const pathname = new URL(nextScript.src, window.location.origin).pathname;
      const match = pathname.match(/^(.*)\/_next\//);
      if (match && match[1]) return match[1].replace(/\/$/, '');
    } catch {
      // ignore and fall back to root-relative paths
    }
  }

  return '';
}

function buildCandidates(primarySrc: string, fallbackChain: readonly string[] = FALLBACK_CHAIN): string[] {
  const basePath = inferBasePath();
  const raw = [primarySrc, ...fallbackChain];
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const src of raw) {
    const normalized = src?.trim();
    if (!normalized) continue;

    if (!seen.has(normalized)) {
      deduped.push(normalized);
      seen.add(normalized);
    }

    if (basePath && normalized.startsWith('/') && !normalized.startsWith(`${basePath}/`)) {
      const withBase = `${basePath}${normalized}`;
      if (!seen.has(withBase)) {
        deduped.push(withBase);
        seen.add(withBase);
      }
    }
  }

  return deduped;
}

export default function ZoeyImage({
  src,
  alt,
  fallbackText = '🐕',
  fallbackChain = [...FALLBACK_CHAIN],
  className = '',
  'data-testid': testId,
  ...rest
}: ZoeyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [candidates, setCandidates] = useState<string[]>([src, ...fallbackChain]);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set());
  const [allFailed, setAllFailed] = useState(false);

  useEffect(() => {
    const nextCandidates = buildCandidates(src, fallbackChain);
    setCandidates(nextCandidates);
    setCurrentSrc(nextCandidates[0] || src);
    setFailedSrcs(new Set());
    setAllFailed(false);
  }, [src, fallbackChain]);

  const advanceFallback = useCallback(
    (failedSrc: string) => {
      setFailedSrcs((prev) => {
        const next = new Set(prev);
        next.add(failedSrc);

        const nextCandidate = candidates.find((candidate) => !next.has(candidate));

        if (nextCandidate) {
          setCurrentSrc(nextCandidate);
        } else {
          setAllFailed(true);
        }

        return next;
      });
    },
    [candidates],
  );

  const handleError = useCallback(() => {
    advanceFallback(currentSrc);
  }, [advanceFallback, currentSrc]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0 && !allFailed) {
      advanceFallback(currentSrc);
    }
  });

  if (allFailed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`inline-flex items-center justify-center bg-amber-100 text-amber-700 font-bold select-none ${className}`}
        data-testid={testId}
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      {...rest}
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      data-testid={testId}
    />
  );
}

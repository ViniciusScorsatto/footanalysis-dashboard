import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {CSSProperties} from 'react';
import type {FootballVideoTemplate} from '../lib/types';
import {
  FOOTBALL_SHORT_INTRO_FRAMES,
  FOOTBALL_SHORT_TEASER_FRAMES,
} from '../lib/football-short-durations';

export type FootballShortTeaserVariant =
  | 'results'
  | 'next-games'
  | 'predictions'
  | 'championship'
  | 'relegation';

export const SHORT_TEASER_DURATION_FRAMES = FOOTBALL_SHORT_TEASER_FRAMES;
export const SHORT_INTRO_DURATION_FRAMES = FOOTBALL_SHORT_INTRO_FRAMES;

export const TEASER_HEADLINE_FONT = '"Orbitron Teaser", "Arial Black", "Impact", sans-serif';
export const TEASER_NUMBER_FONT = '"Oxanium Teaser", "Arial Black", "Impact", sans-serif';
export const TEASER_LABEL_FONT = '"Audiowide Teaser", "Orbitron Teaser", "Arial Black", sans-serif';

export const TEASER_HEADLINE_EFFECT: CSSProperties = {
  fontFamily: TEASER_HEADLINE_FONT,
  letterSpacing: 0,
  WebkitTextStroke: '1px rgba(5,8,6,0.72)',
};

export const TEASER_NUMBER_EFFECT: CSSProperties = {
  fontFamily: TEASER_NUMBER_FONT,
  letterSpacing: 0,
  WebkitTextStroke: '2px rgba(5,8,6,0.78)',
};

const TEASER_BACKGROUNDS = {
  stadiumLights: 'backgrounds/teaser-stadium-lights.png',
  goalPitch: 'backgrounds/teaser-goal-pitch.png',
  arenaPerspective: 'backgrounds/teaser-arena-perspective.png',
  techBall: 'backgrounds/teaser-tech-ball.png',
} as const;

export const FootballShortFontFaces = () => (
  <style>
    {`
      @font-face {
        font-family: "Orbitron Teaser";
        src: url("${staticFile('fonts/Orbitron-Black.ttf')}") format("truetype");
        font-weight: 900;
        font-style: normal;
      }
      @font-face {
        font-family: "Orbitron Teaser";
        src: url("${staticFile('fonts/Orbitron-ExtraBold.ttf')}") format("truetype");
        font-weight: 800;
        font-style: normal;
      }
      @font-face {
        font-family: "Oxanium Teaser";
        src: url("${staticFile('fonts/Oxanium-ExtraBold.ttf')}") format("truetype");
        font-weight: 900;
        font-style: normal;
      }
      @font-face {
        font-family: "Oxanium Teaser";
        src: url("${staticFile('fonts/Oxanium-Bold.ttf')}") format("truetype");
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: "Audiowide Teaser";
        src: url("${staticFile('fonts/Audiowide-Regular.ttf')}") format("truetype");
        font-weight: 900;
        font-style: normal;
      }
    `}
  </style>
);

export const pickFootballShortBackground = (
  template: FootballVideoTemplate,
  variant?: FootballShortTeaserVariant,
) => {
  if (variant === 'results') return TEASER_BACKGROUNDS.stadiumLights;
  if (variant === 'next-games') return TEASER_BACKGROUNDS.goalPitch;
  if (variant === 'predictions') return TEASER_BACKGROUNDS.techBall;
  if (template === 'standings' || template === 'world-cup-group-standings') {
    return TEASER_BACKGROUNDS.arenaPerspective;
  }
  if (template === 'top-scorers' || template === 'player-of-round') {
    return TEASER_BACKGROUNDS.techBall;
  }
  if (
    template === 'championship-pace' ||
    template === 'champion-final' ||
    template === 'season-final-verdict'
  ) {
    return TEASER_BACKGROUNDS.stadiumLights;
  }
  if (template === 'relegation-line') return TEASER_BACKGROUNDS.arenaPerspective;
  return TEASER_BACKGROUNDS.goalPitch;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const numericValue = Number.parseInt(value || 'f0a500', 16);

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  };
};

const accentRgba = (accentColor: string, opacity: number) => {
  const rgb = hexToRgb(accentColor);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

const TeaserBackdrop = ({
  backgroundPath,
  accentColor,
  intensity = 1,
}: {
  backgroundPath: string;
  accentColor: string;
  intensity?: number;
}) => (
  <>
    <Img
      src={staticFile(backgroundPath)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.82,
        filter: 'contrast(1.08) brightness(0.78)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 50% 38%, ${accentRgba(accentColor, 0.26 * intensity)}, transparent 31%), ` +
          `radial-gradient(circle at 50% 78%, ${accentRgba(accentColor, 0.18 * intensity)}, transparent 30%), ` +
          'linear-gradient(180deg, rgba(2,4,7,0.34), rgba(2,4,7,0.1) 44%, rgba(2,4,7,0.74))',
        mixBlendMode: 'screen',
        opacity: 0.72,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(3,5,8,0.18), rgba(3,5,8,0.06) 44%, rgba(3,5,8,0.58)), radial-gradient(circle at 50% 50%, transparent 38%, rgba(0,0,0,0.52))',
      }}
    />
  </>
);

export const FootballShortBackdrop = ({
  template,
  variant,
  accentColor,
  opacity = 0.5,
  intensity = 0.72,
}: {
  template: FootballVideoTemplate;
  variant?: FootballShortTeaserVariant;
  accentColor: string;
  opacity?: number;
  intensity?: number;
}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
    <TeaserBackdrop
      backgroundPath={pickFootballShortBackground(template, variant)}
      accentColor={accentColor}
      intensity={intensity}
    />
  </AbsoluteFill>
);

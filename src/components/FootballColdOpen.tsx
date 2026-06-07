import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FootballShortBackdrop} from './FootballShortTeaser';
import type {FootballColdOpenData, FootballVideoTemplate} from '../lib/types';

type FootballColdOpenProps = {
  accentColor: string;
  secondaryAccentColor?: string;
  brandName: string;
  brandLogoPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
  startSettled?: boolean;
  template?: FootballVideoTemplate;
  variant?: 'results' | 'next-games' | 'predictions' | 'championship' | 'relegation';
};

export const FootballColdOpen = ({
  accentColor,
  secondaryAccentColor,
  brandName,
  brandLogoPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
  startSettled = false,
  template,
  variant,
}: FootballColdOpenProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const accentFill = secondaryAccentColor
    ? `linear-gradient(90deg, ${accentColor}, ${secondaryAccentColor})`
    : accentColor;
  const verticalAccentFill = secondaryAccentColor
    ? `linear-gradient(180deg, ${accentColor}, ${secondaryAccentColor})`
    : accentColor;

  const fadeOutStart = Math.round(fps * 1.28);
  const fadeOutEnd = Math.round(fps * 1.5);
  const opacity = startSettled
    ? interpolate(frame, [0, fadeOutStart, fadeOutEnd], [1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [0, 4, fadeOutStart, fadeOutEnd], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
      });
  const logoScale = startSettled ? 1 : interpolate(frame, [0, 5, 12, fadeOutStart], [0.72, 1.1, 1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineGrow = startSettled ? 1 : interpolate(frame, [0, 8, fadeOutStart], [0.08, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashOpacity = startSettled ? 0 : interpolate(frame, [0, 2, 9], [0.72, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleLift = startSettled ? 0 : interpolate(frame, [0, 12], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = startSettled ? 1 : interpolate(frame, [4, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hookOpacity = startSettled ? 1 : interpolate(frame, [10, 17, fadeOutStart - 2], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hookLift = startSettled ? 0 : interpolate(frame, [10, 18], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glitchShift = frame % 6 < 2 ? 6 : frame % 9 < 2 ? -4 : 0;
  const textHighlightWidth = startSettled ? 100 : interpolate(frame, [10, 20], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dataPanelOpacity = startSettled ? 0.88 : interpolate(frame, [5, 13, fadeOutStart], [0, 0.92, 0.82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dataSlide = interpolate(frame % 18, [0, 17], [0, -72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitWipe = interpolate(frame, [fadeOutStart - 4, fadeOutEnd], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (opacity <= 0.01) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 50,
        opacity,
        background: '#0b0d12',
      }}
    >
      {template ? (
        <FootballShortBackdrop
          template={template}
          variant={variant}
          accentColor={accentColor}
          opacity={0.5}
          intensity={0.68}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(circle at 50% 42%, ${accentColor}33, transparent 28%), radial-gradient(circle at 18% 16%, rgba(255,255,255,0.14), transparent 18%), linear-gradient(180deg, rgba(11,13,18,0.76), rgba(11,13,18,0.88))`,
        }}
      />

      <AbsoluteFill
        style={{
          opacity: flashOpacity,
          background: '#ffffff',
          mixBlendMode: 'screen',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          transform: `translateY(${-frame * 2}px)`,
        }}
      />

      <DataTickerPanel
        accentColor={accentColor}
        secondaryAccentColor={secondaryAccentColor}
        opacity={dataPanelOpacity}
        translateY={dataSlide}
        matchRows={coldOpenData?.matchRows}
        tableRows={coldOpenData?.tableRows}
      />
      <StandingsTickerPanel
        accentColor={accentColor}
        secondaryAccentColor={secondaryAccentColor}
        opacity={dataPanelOpacity}
        translateY={-dataSlide * 0.72}
        rows={coldOpenData?.tableRows}
      />

      <div
        style={{
          position: 'absolute',
          top: 68,
          left: 0,
          width: `${760 * lineGrow}px`,
          height: 12,
          background: accentFill,
          boxShadow: `0 0 30px ${accentColor}88`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 98,
          right: 0,
          width: `${560 * lineGrow}px`,
          height: 8,
          background: accentFill,
          boxShadow: `0 0 26px ${accentColor}77`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 7,
          height: `${520 * lineGrow}px`,
          background: verticalAccentFill,
          boxShadow: `0 0 26px ${accentColor}66`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 44,
          width: 7,
          height: `${420 * lineGrow}px`,
          background: verticalAccentFill,
          boxShadow: `0 0 26px ${accentColor}55`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 310,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, ${secondaryAccentColor ?? accentColor}, transparent)`,
          opacity: lineGrow,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
          transform: `scale(${logoScale})`,
        }}
      >
        {brandLogoPath ? (
          <div style={{position: 'relative', width: 420, height: 150}}>
            <Img
              src={staticFile(brandLogoPath.replace(/^\//, ''))}
              style={{
                position: 'absolute',
                inset: 0,
                width: 420,
                height: 150,
                objectFit: 'contain',
                opacity: frame < 14 ? 0.45 : 0,
                transform: `translateX(${glitchShift}px)`,
                filter: 'drop-shadow(0 0 18px rgba(255,0,64,0.75))',
              }}
            />
            <Img
              src={staticFile(brandLogoPath.replace(/^\//, ''))}
              style={{
                position: 'absolute',
                inset: 0,
                width: 420,
                height: 150,
                objectFit: 'contain',
                opacity: frame < 14 ? 0.45 : 0,
                transform: `translateX(${-glitchShift}px)`,
                filter: `drop-shadow(0 0 18px ${accentColor}AA)`,
              }}
            />
            <Img
              src={staticFile(brandLogoPath.replace(/^\//, ''))}
              style={{
                position: 'absolute',
                inset: 0,
                width: 420,
                height: 150,
                objectFit: 'contain',
                filter: `drop-shadow(0 0 34px ${accentColor}55) drop-shadow(0 8px 24px rgba(0,0,0,0.5))`,
              }}
            />
          </div>
        ) : (
          <div
            style={{
              fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
              fontSize: 112,
              lineHeight: 0.9,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 0,
              color: '#ffffff',
              textAlign: 'center',
            }}
          >
            {brandName}
          </div>
        )}
        {introTitle?.trim() ? (
          <div
            style={{
              width: 860,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
              textTransform: 'uppercase',
              opacity: titleOpacity,
              transform: `translateY(${titleLift}px)`,
              filter: `drop-shadow(0 0 26px ${accentColor}44)`,
            }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: 860,
                fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
                fontSize: 74,
                lineHeight: 0.94,
                fontWeight: 900,
                letterSpacing: 0,
                color: '#f0f4f8',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: `${100 - textHighlightWidth}%`,
                  bottom: -8,
                  height: 8,
                  background: accentFill,
                  boxShadow: `0 0 18px ${accentColor}88`,
                }}
              />
              {introTitle}
            </div>
            {introSubtitle?.trim() ? (
              <div
                style={{
                  maxWidth: 780,
                  padding: '12px 22px 10px',
                  borderRadius: 999,
                  background: '#0f1318',
                  border: `2px solid ${accentColor}`,
                  fontFamily: '"Barlow", "Arial", sans-serif',
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: accentColor,
                }}
              >
                {introSubtitle}
              </div>
            ) : null}
            {hookText?.trim() ? (
              <div
                style={{
                  width: 'fit-content',
                  maxWidth: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  marginTop: 34,
                  padding: '22px 36px 19px',
                  borderRadius: 34,
                  border: `2px solid ${accentColor}88`,
                  background:
                    `linear-gradient(100deg, ${accentColor}26, rgba(15,19,24,0.96) 42%, ${accentColor}12)`,
                  boxShadow:
                    `0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 30px ${accentColor}28, 0 18px 42px rgba(0,0,0,0.42)`,
                  opacity: hookOpacity,
                  transform: `translateY(${hookLift}px)`,
                }}
              >
                <div
                  style={{
                  width: 68,
                  height: 10,
                  flex: '0 0 auto',
                  borderRadius: 999,
                    background: accentFill,
                    boxShadow: `0 0 20px ${accentColor}`,
                  }}
                />
                <div
                  style={{
                    maxWidth: 748,
                    overflow: 'hidden',
                    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
                    fontSize: hookText.trim().length > 38 ? 42 : 54,
                    lineHeight: 0.94,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    textWrap: 'balance',
                    color: '#ffffff',
                    textShadow: '0 2px 18px rgba(0,0,0,0.9)',
                  }}
                >
                  {hookText}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${exitWipe}%) skewX(-12deg)`,
          transformOrigin: 'left center',
          background: `linear-gradient(90deg, transparent 0 24%, ${accentColor} 24% 28%, ${secondaryAccentColor ?? accentColor} 28% 32%, #0b0d12 32% 100%)`,
          opacity: interpolate(frame, [fadeOutStart - 4, fadeOutEnd], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};

const tickerRows = [
  {left: 'PAL', center: '2 - 1', right: 'FLA'},
  {left: 'BOT', center: '3 - 0', right: 'SAN'},
  {left: 'SAO', center: '1 - 1', right: 'GRE'},
  {left: 'BAH', center: '4 - 2', right: 'VAS'},
];

const tableRows = [
  {rank: '1', club: 'ARSENAL', pts: '22'},
  {rank: '2', club: 'LIVERPOOL', pts: '20'},
  {rank: '3', club: 'MAN CITY', pts: '19'},
  {rank: '4', club: 'CHELSEA', pts: '17'},
];

const DataTickerPanel = ({
  accentColor,
  secondaryAccentColor,
  opacity,
  translateY,
  matchRows,
  tableRows: dynamicTableRows,
}: {
  accentColor: string;
  secondaryAccentColor?: string;
  opacity: number;
  translateY: number;
  matchRows?: FootballColdOpenData['matchRows'];
  tableRows?: FootballColdOpenData['tableRows'];
}) => {
  const accentFill = secondaryAccentColor
    ? `linear-gradient(90deg, ${accentColor}, ${secondaryAccentColor})`
    : accentColor;

  return (
  <div
    style={{
      position: 'absolute',
      left: 62,
      bottom: 136,
      width: 360,
      height: 300,
      overflow: 'hidden',
      opacity,
      transform: 'rotate(-3deg)',
      border: `2px solid ${accentColor}88`,
      background: 'linear-gradient(180deg, rgba(15,19,24,0.92), rgba(11,13,18,0.76))',
      boxShadow: `0 0 28px ${accentColor}33`,
    }}
  >
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        background: accentFill,
        color: '#0b0d12',
        fontFamily: '"Barlow", "Arial", sans-serif',
        fontSize: 19,
        fontWeight: 900,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      Live Data Feed
    </div>
    <div
      style={{
        padding: '16px 16px 0',
        transform: `translateY(${translateY}px)`,
      }}
    >
      {[...(matchRows?.length ? matchRows : tickerRows), ...(dynamicTableRows?.length ? dynamicTableRows : tableRows)].map((row, index) => {
        const isMatchRow = 'center' in row;

        return (
          <div
            key={`${index}-${isMatchRow ? row.left : row.club}`}
            style={{
              height: 56,
              display: 'grid',
              gridTemplateColumns: isMatchRow ? '1fr 92px 1fr' : '42px 1fr 60px',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              padding: '0 12px',
              background: index % 2 === 0 ? '#141c24' : '#0f1318',
              borderLeft: `5px solid ${index < 2 ? accentColor : '#3a5060'}`,
              color: '#f0f4f8',
              fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
              fontSize: 24,
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {isMatchRow ? (
              <>
                <span>{row.left}</span>
                <span
                  style={{
                    padding: '6px 8px',
                    textAlign: 'center',
                    color: accentColor,
                    background: '#0b0d12',
                    borderRadius: 6,
                  }}
                >
                  {row.center}
                </span>
                <span style={{textAlign: 'right'}}>{row.right}</span>
              </>
            ) : (
              <>
                <span style={{color: accentColor}}>{row.rank}</span>
                <span>{row.club}</span>
                <span style={{textAlign: 'right', color: accentColor}}>{row.pts}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  </div>
  );
};

const StandingsTickerPanel = ({
  accentColor,
  secondaryAccentColor,
  opacity,
  translateY,
  rows,
}: {
  accentColor: string;
  secondaryAccentColor?: string;
  opacity: number;
  translateY: number;
  rows?: FootballColdOpenData['tableRows'];
}) => {
  const accentFill = secondaryAccentColor
    ? `linear-gradient(90deg, ${accentColor}, ${secondaryAccentColor})`
    : accentColor;

  return (
  <div
    style={{
      position: 'absolute',
      right: 64,
      top: 250,
      width: 330,
      height: 282,
      overflow: 'hidden',
      opacity: opacity * 0.92,
      transform: 'rotate(3deg)',
      border: `2px solid ${accentColor}77`,
      background: 'linear-gradient(180deg, rgba(15,19,24,0.9), rgba(11,13,18,0.72))',
      boxShadow: `0 0 28px ${accentColor}2F`,
    }}
  >
    <div
      style={{
        height: 46,
        display: 'grid',
        gridTemplateColumns: '52px 1fr 62px',
        alignItems: 'center',
        padding: '0 14px',
        background: `linear-gradient(90deg, rgba(15,19,24,0.98), rgba(15,19,24,0.86)), ${accentFill}`,
        borderBottom: `2px solid ${accentColor}`,
        color: '#3a5060',
        fontFamily: '"Barlow", "Arial", sans-serif',
        fontSize: 16,
        fontWeight: 900,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
      }}
    >
      <span>Pos</span>
      <span>Clube</span>
      <span style={{textAlign: 'right'}}>Pts</span>
    </div>
    <div
      style={{
        padding: '14px 14px 0',
        transform: `translateY(${translateY}px)`,
      }}
    >
      {[...(rows?.length ? rows : tableRows), ...(rows?.length ? rows : tableRows)].map((row, index) => (
        <div
          key={`${index}-${row.club}`}
          style={{
            height: 48,
            display: 'grid',
            gridTemplateColumns: '44px 1fr 54px',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            padding: '0 10px',
            background:
              index % 4 === 0
                ? secondaryAccentColor
                  ? `linear-gradient(90deg, ${accentColor}33, ${secondaryAccentColor}24 48%, rgba(20,28,36,0.96))`
                  : `linear-gradient(90deg, ${accentColor}33, rgba(20,28,36,0.96))`
                : index % 2 === 0
                  ? '#141c24'
                  : '#0f1318',
            borderLeft: `5px solid ${index % 4 < 2 ? accentColor : '#3a5060'}`,
            color: '#f0f4f8',
            fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
            fontSize: 22,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          <span style={{color: index % 4 < 2 ? accentColor : '#c0ccd8'}}>{row.rank}</span>
          <span>{row.club}</span>
          <span style={{textAlign: 'right', color: accentColor}}>{row.pts}</span>
        </div>
      ))}
    </div>
  </div>
  );
};

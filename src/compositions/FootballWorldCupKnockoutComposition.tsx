import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CSSProperties} from 'react';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {
  FootballShortOpening,
  SHORT_MAIN_ENTRY_PREROLL_FRAMES,
  SHORT_OPENING_DURATION_FRAMES,
} from '../components/FootballShortOpening';
import {
  FootballShortBackdrop,
  FootballShortFontFaces,
  TEASER_HEADLINE_FONT,
  TEASER_LABEL_FONT,
  TEASER_NUMBER_FONT,
} from '../components/FootballShortTeaserKit';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  HEADER_STAGGER_FRAMES,
  ROWS_START_FRAME,
  entranceStyle,
  fadeInStyle,
  footerStartFrame,
  headerEntranceStyle,
} from '../lib/animations';
import type {FootballColdOpenData, TeamBadge, WorldCupKnockoutMatch} from '../lib/types';

const BRACKET_SIDE_SIZE = 8;

type FootballWorldCupKnockoutCompositionProps = {
  titleLabel: string;
  phaseLabel: string;
  ctaText: string;
  matches: WorldCupKnockoutMatch[];
  brandName: string;
  brandLogoPath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
};

export const FootballWorldCupKnockoutComposition = ({
  titleLabel,
  phaseLabel,
  ctaText,
  matches,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
}: FootballWorldCupKnockoutCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const leftMatches = matches.slice(0, BRACKET_SIDE_SIZE);
  const rightMatches = matches.slice(BRACKET_SIDE_SIZE, BRACKET_SIDE_SIZE * 2);
  const localFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const isEnglish = /^world cup/i.test(titleLabel);
  const mainTitle = isEnglish ? 'Bracket' : 'Mata-Mata';

  const chipAnim = headerEntranceStyle(localFrame, fps, 0);
  const titleAnim = headerEntranceStyle(localFrame, fps, HEADER_STAGGER_FRAMES);
  const phaseAnim = headerEntranceStyle(localFrame, fps, HEADER_STAGGER_FRAMES * 2);
  const bracketAnim = fadeInStyle(localFrame, fps, ROWS_START_FRAME);
  const footerAnim = fadeInStyle(localFrame, fps, footerStartFrame(8));

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: TEASER_NUMBER_FONT,
        background: '#0b0d12',
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop
        template="world-cup-knockout"
        accentColor="#F0D500"
        opacity={0.5}
      />
      <FootballShortOpening
        template="world-cup-knockout"
        channelProfile={isEnglish ? 'en' : 'pt'}
        leagueName={isEnglish ? 'World Cup' : 'Copa do Mundo'}
        titleLabel={titleLabel}
        phaseLabel={phaseLabel}
        matches={matches}
        accentColor="#F0D500"
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
      />
      <Sequence from={SHORT_OPENING_DURATION_FRAMES}>
        <VoiceoverBed voiceoverPath={voiceoverPath} />
        <CompetitionAccentRail accentColor="#F0D500" />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 10,
            background:
              'linear-gradient(90deg, #F0D500 0 33%, #27AE60 33% 66%, #E74C3C 66% 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '40px 28px 118px 72px',
          }}
        >
        {/* Animated header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={chipAnim}>
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 18px 8px',
                borderRadius: 999,
                background: '#0f1318',
                borderLeft: '8px solid #F0D500',
                color: '#F0D500',
                fontFamily: TEASER_LABEL_FONT,
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {titleLabel}
            </div>
          </div>

          <div
            style={{
              fontSize: 96,
              lineHeight: 0.92,
              fontWeight: 900,
              fontFamily: TEASER_HEADLINE_FONT,
              letterSpacing: 0,
              textTransform: 'uppercase',
              color: '#F0D500',
              ...titleAnim,
            }}
          >
            {mainTitle}
          </div>

          {/* Phase label — Slate + weight 600 per brand spec §03 */}
          <div
            style={{
              color: '#3a5060',
              fontSize: 56,
              lineHeight: 1,
              fontWeight: 600,
              fontFamily: TEASER_LABEL_FONT,
              textTransform: 'uppercase',
              ...phaseAnim,
            }}
          >
            {phaseLabel}
          </div>
        </div>

        {/* Bracket board */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            marginTop: 34,
            ...bracketAnim,
          }}
        >
          <BracketBoard
            leftMatches={leftMatches}
            rightMatches={rightMatches}
            frame={localFrame}
            fps={fps}
            isEnglish={isEnglish}
          />
        </div>

        {/* Animated footer */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            ...footerAnim,
          }}
        >
          <div
            style={{
              maxWidth: 560,
              padding: '16px 24px 14px',
              borderRadius: 20,
              background: '#0f1318',
              border: '2px solid #F0D500',
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {ctaText}
          </div>

          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const BracketBoard = ({
  leftMatches,
  rightMatches,
  frame,
  fps,
  isEnglish,
}: {
  leftMatches: WorldCupKnockoutMatch[];
  rightMatches: WorldCupKnockoutMatch[];
  frame: number;
  fps: number;
  isEnglish: boolean;
}) => (
  <div
    style={{
      position: 'relative',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 270px minmax(0, 1fr)',
      gap: 18,
      alignItems: 'stretch',
    }}
  >
    <BracketSide matches={leftMatches} side="left" frame={frame} fps={fps} />
    <CenterBracketPath frame={frame} fps={fps} isEnglish={isEnglish} />
    <BracketSide matches={rightMatches} side="right" frame={frame} fps={fps} />
  </div>
);

const BracketSide = ({
  matches,
  side,
  frame,
  fps,
}: {
  matches: WorldCupKnockoutMatch[];
  side: 'left' | 'right';
  frame: number;
  fps: number;
}) => (
  <div
    style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns:
        side === 'left' ? '118px 72px 56px 42px' : '42px 56px 72px 118px',
      gap: 12,
      minHeight: 0,
    }}
  >
    {side === 'left' ? (
      <>
        <Round32Column matches={matches} side={side} frame={frame} fps={fps} />
        <PlaceholderColumn count={4} side={side} frame={frame} fps={fps} delay={10} />
        <PlaceholderColumn count={2} side={side} frame={frame} fps={fps} delay={18} />
        <PlaceholderColumn count={1} side={side} frame={frame} fps={fps} delay={26} />
      </>
    ) : (
      <>
        <PlaceholderColumn count={1} side={side} frame={frame} fps={fps} delay={26} />
        <PlaceholderColumn count={2} side={side} frame={frame} fps={fps} delay={18} />
        <PlaceholderColumn count={4} side={side} frame={frame} fps={fps} delay={10} />
        <Round32Column matches={matches} side={side} frame={frame} fps={fps} />
      </>
    )}
  </div>
);

const Round32Column = ({
  matches,
  side,
  frame,
  fps,
}: {
  matches: WorldCupKnockoutMatch[];
  side: 'left' | 'right';
  frame: number;
  fps: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateRows: `repeat(${BRACKET_SIDE_SIZE}, 1fr)`,
      gap: 10,
      minHeight: 0,
    }}
  >
    {Array.from({length: BRACKET_SIDE_SIZE}).map((_, index) => {
      const match = matches[index];
      const anim = entranceStyle(frame, fps, ROWS_START_FRAME + index * 2);

      return (
        <BracketMatchNode
          key={`${side}-${index}-${match?.homeTeam ?? 'empty'}`}
          match={match}
          side={side}
          style={anim}
        />
      );
    })}
  </div>
);

const PlaceholderColumn = ({
  count,
  side,
  frame,
  fps,
  delay,
}: {
  count: number;
  side: 'left' | 'right';
  frame: number;
  fps: number;
  delay: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateRows: `repeat(${count}, 1fr)`,
      gap: count === 1 ? 0 : count === 2 ? 60 : 24,
      alignItems: 'center',
      minHeight: 0,
    }}
  >
    {Array.from({length: count}).map((_, index) => (
      <PlaceholderSeed
        key={`${side}-${count}-${index}`}
        side={side}
        style={fadeInStyle(frame, fps, ROWS_START_FRAME + delay + index * 2)}
      />
    ))}
  </div>
);

const PlaceholderSeed = ({side, style}: {side: 'left' | 'right'; style: CSSProperties}) => (
  <div
    style={{
      position: 'relative',
      height: 46,
      borderRadius: 999,
      background: '#101820',
      border: '2px solid rgba(192,204,216,0.26)',
      display: 'grid',
      placeItems: 'center',
      boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
      ...style,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        background: '#141c24',
        border: '2px solid rgba(240,213,0,0.22)',
      }}
    />
    <BracketConnector side={side} />
  </div>
);

const BracketMatchNode = ({
  match,
  side,
  style,
}: {
  match?: WorldCupKnockoutMatch;
  side: 'left' | 'right';
  style: CSSProperties;
}) => {
  const emptyMatch: WorldCupKnockoutMatch = {
    homeTeam: 'TBD',
    awayTeam: 'TBD',
    homeScore: null,
    awayScore: null,
    homeBadge: {label: 'TBD'},
    awayBadge: {label: 'TBD'},
    statusLabel: '',
    winner: 'none',
  };
  const resolvedMatch = match ?? emptyMatch;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: side === 'left' ? 'row' : 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, rgba(15,19,24,0.96), rgba(10,14,20,0.9))',
        border: '2px solid rgba(240,213,0,0.18)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
        ...style,
      }}
    >
      <SeedLine
        badge={resolvedMatch.homeBadge}
        state={
          resolvedMatch.winner === 'home'
            ? 'winner'
            : resolvedMatch.winner === 'away'
              ? 'loser'
              : 'neutral'
        }
      />
      <SeedLine
        badge={resolvedMatch.awayBadge}
        state={
          resolvedMatch.winner === 'away'
            ? 'winner'
            : resolvedMatch.winner === 'home'
              ? 'loser'
              : 'neutral'
        }
      />
      <BracketConnector side={side} />
    </div>
  );
};

const SeedLine = ({
  badge,
  state,
}: {
  badge: TeamBadge;
  state: 'winner' | 'loser' | 'neutral';
}) => {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 999,
        background: state === 'winner' ? '#0b1409' : '#101820',
        border:
          state === 'winner'
            ? '2px solid rgba(240,213,0,0.75)'
            : state === 'loser'
              ? '2px solid rgba(231,76,60,0.55)'
              : '2px solid rgba(192,204,216,0.32)',
      }}
    >
      <Badge badge={badge} size={34} />
    </div>
  );
};

const BracketConnector = ({side}: {side: 'left' | 'right'}) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      [side === 'left' ? 'right' : 'left']: -14,
      width: 14,
      height: 2,
      background: 'rgba(240,213,0,0.55)',
    }}
  />
);

const CenterBracketPath = ({
  frame,
  fps,
  isEnglish,
}: {
  frame: number;
  fps: number;
  isEnglish: boolean;
}) => {
  const anim = fadeInStyle(frame, fps, ROWS_START_FRAME + 10);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        ...anim,
      }}
    >
      <ConnectorLayer />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 158,
          height: 86,
          borderRadius: 20,
          background: '#101820',
          border: '2px solid rgba(240,213,0,0.5)',
          display: 'grid',
          placeItems: 'center',
          color: '#F0D500',
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          boxShadow: '0 0 34px rgba(240,213,0,0.13)',
        }}
      >
        {isEnglish ? 'Final' : 'Final'}
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 22,
          transform: 'translateX(-50%)',
          padding: '8px 14px',
          borderRadius: 999,
          background: '#101820',
          border: '2px solid rgba(192,204,216,0.22)',
          color: '#3a5060',
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {isEnglish ? '3rd place' : '3º lugar'}
      </div>
    </div>
  );
};

const ConnectorLayer = () => (
  <div
    style={{
      position: 'absolute',
      inset: '-18px -34px',
      opacity: 0.5,
      pointerEvents: 'none',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: '50%',
        width: 2,
        background: 'linear-gradient(180deg, transparent, #F0D500 18%, #F0D500 82%, transparent)',
      }}
    />
    {['9%', '21%', '34%', '50%', '66%', '79%', '91%'].map((top) => (
      <div
        key={top}
        style={{
          position: 'absolute',
          top,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, #F0D500, transparent)',
        }}
      />
    ))}
  </div>
);

const Badge = ({badge, size = 44}: {badge: TeamBadge; size?: number}) => {
  if (badge.imagePath || badge.logoPath) {
    return (
      <Img
        src={staticFile((badge.imagePath ?? badge.logoPath ?? '').replace(/^\//, ''))}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.48),
        lineHeight: 1,
        fontWeight: 700,
        color: '#c0ccd8',
      }}
    >
      {badge.label}
    </div>
  );
};

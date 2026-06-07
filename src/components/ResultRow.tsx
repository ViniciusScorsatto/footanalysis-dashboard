import type {ReactNode} from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FixtureCard, FootballChannelProfile} from '../lib/types';
import {entranceStyle, rowStartFrame, scorePopStyle} from '../lib/animations';

type ResultRowProps = {
  fixture: FixtureCard;
  variant: 'results' | 'next-games' | 'predictions';
  rowIndex: number;
  accentColor?: string;
  channelProfile?: FootballChannelProfile;
  leagueId?: number;
};

export const ResultRow = ({
  fixture,
  variant,
  rowIndex,
  accentColor = '#F0A500',
  channelProfile = 'pt',
  leagueId,
}: ResultRowProps) => {
  if (variant === 'results' || variant === 'next-games' || variant === 'predictions') {
    return (
      <BrandedResultRow
        fixture={fixture}
        variant={variant}
        rowIndex={rowIndex}
        accentColor={accentColor}
        channelProfile={channelProfile}
        leagueId={leagueId}
      />
    );
  }
};

const BrandedResultRow = ({
  fixture,
  variant,
  rowIndex,
  accentColor,
  channelProfile,
  leagueId,
}: {
  fixture: FixtureCard;
  variant: 'results' | 'next-games' | 'predictions';
  rowIndex: number;
  accentColor: string;
  channelProfile: FootballChannelProfile;
  leagueId?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const isEnglish = channelProfile === 'en';
  const isEuropeanNight = leagueId === 2 || leagueId === 3;
  const surfaceColor = isEnglish
    ? isEuropeanNight
      ? leagueId === 2
        ? rowIndex % 2 === 0
          ? '#0e0c1e'
          : '#111128'
        : rowIndex % 2 === 0
          ? '#14100a'
          : '#18130d'
      : rowIndex % 2 === 0
        ? '#141c24'
        : '#0f1318'
    : rowIndex % 2 === 0
      ? '#0f1318'
      : '#141c24';
  const rowEnterFrame = rowStartFrame(rowIndex);
  const anim = entranceStyle(frame, fps, rowEnterFrame);
  // Score pops in ~10 frames after the row starts entering (row is mostly visible by then).
  const scorePopStart = rowEnterFrame + 10;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 118px minmax(0, 1fr)',
        alignItems: 'center',
        minHeight: 104,
        padding: '0 16px',
        borderRadius: 24,
        background: surfaceColor,
        border: isEnglish ? '1px solid #1e2a3a' : 'none',
        borderLeft: isEnglish
          ? isEuropeanNight
            ? `4px solid ${accentColor}`
            : '1px solid #1e2a3a'
          : `8px solid ${accentColor}`,
        boxShadow: isEnglish ? '0 6px 14px rgba(0,0,0,0.18)' : 'none',
        ...anim,
      }}
    >
      <BrandedTeam
        badge={fixture.homeBadge}
        team={fixture.homeTeam}
        align="left"
        channelProfile={channelProfile}
        isEliminated={fixture.homeEliminated}
      />
      <BrandedScore
        homeScore={fixture.homeScore}
        awayScore={fixture.awayScore}
        hasPenalties={fixture.hasPenalties}
        homePenaltyScore={fixture.homePenaltyScore}
        awayPenaltyScore={fixture.awayPenaltyScore}
        variant={variant}
        accentColor={accentColor}
        channelProfile={channelProfile}
        isEuropeanNight={isEuropeanNight}
        frame={frame}
        fps={fps}
        popStartFrame={scorePopStart}
      />
      <BrandedTeam
        badge={fixture.awayBadge}
        team={fixture.awayTeam}
        align="right"
        channelProfile={channelProfile}
        isEliminated={fixture.awayEliminated}
      />
    </div>
  );
};

const BrandedTeam = ({
  badge,
  team,
  align,
  channelProfile,
  isEliminated = false,
}: {
  badge: FixtureCard['homeBadge'];
  team: string;
  align: 'left' | 'right';
  channelProfile: FootballChannelProfile;
  isEliminated?: boolean;
}) => {
  const fontSize = fitFixtureTeamFontSize(team);

  return (
    <div
      style={{
        minWidth: 0,
        display: 'flex',
        flexDirection: align === 'left' ? 'row' : 'row-reverse',
        alignItems: 'center',
        gap: 10,
        opacity: isEliminated ? 0.55 : 1,
      }}
    >
      <TeamBadge badge={badge} size={72} isEliminated={isEliminated} />
      <div
        style={{
          minWidth: 0,
          flex: 1,
          color: isEliminated ? '#7f8c99' : channelProfile === 'en' ? '#f0f4f8' : '#c0ccd8',
          fontSize,
          lineHeight: 0.95,
          fontWeight: 700,
          letterSpacing: fontSize < 27 ? 0 : -0.6,
          textAlign: align,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          textShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 10px rgba(255,255,255,0.16)',
        }}
      >
        {team}
      </div>
    </div>
  );
};

const fitFixtureTeamFontSize = (team: string) => {
  const weightedLength = [...team.trim().toUpperCase()].reduce((total, char) => {
    if (char === ' ') {
      return total + 0.38;
    }
    if ('1IÍÌÎÏL.'.includes(char)) {
      return total + 0.42;
    }
    if ('MW@'.includes(char)) {
      return total + 1.16;
    }
    if ('-–/'.includes(char)) {
      return total + 0.5;
    }
    return total + 0.78;
  }, 0);
  const targetWidth = 238;
  const fitted = Math.floor(targetWidth / Math.max(1, weightedLength));

  return Math.max(20, Math.min(34, fitted));
};

const BrandedScore = ({
  homeScore,
  awayScore,
  hasPenalties,
  homePenaltyScore,
  awayPenaltyScore,
  variant,
  accentColor,
  channelProfile,
  isEuropeanNight,
  frame,
  fps,
  popStartFrame,
}: {
  homeScore: number | null;
  awayScore: number | null;
  hasPenalties?: boolean;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  variant: 'results' | 'next-games' | 'predictions';
  accentColor: string;
  channelProfile: FootballChannelProfile;
  isEuropeanNight: boolean;
  frame: number;
  fps: number;
  popStartFrame: number;
}) => {
  const hasScore = homeScore !== null && awayScore !== null;
  const showPenaltyScore =
    Boolean(hasPenalties) &&
    typeof homePenaltyScore === 'number' &&
    typeof awayPenaltyScore === 'number';
  const pop = scorePopStyle(frame, fps, popStartFrame);
  const isEnglish = channelProfile === 'en';
  const isPrediction = variant === 'predictions';
  const scoreColor = isEnglish
    ? isEuropeanNight
      ? accentColor
      : isPrediction
        ? accentColor
        : '#f0f4f8'
    : accentColor;
  return (
    <div
      style={{
        justifySelf: 'center',
        minWidth: 100,
        padding: 0,
        borderRadius: 0,
        background: 'transparent',
        border: 'none',
        color: scoreColor,
        lineHeight: 1,
        fontWeight: 900,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showPenaltyScore ? 7 : 0,
        textShadow: `0 0 18px ${accentColor}55, 0 8px 16px rgba(0,0,0,0.68)`,
        ...pop,
      }}
    >
      <span
        style={{
          fontSize: hasScore ? (showPenaltyScore ? 42 : 52) : 36,
          lineHeight: 0.92,
          whiteSpace: 'nowrap',
        }}
      >
        {hasScore ? `${homeScore} – ${awayScore}` : 'VS'}
      </span>
      {showPenaltyScore ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 999,
            background: isEnglish ? '#111827' : 'rgba(240, 165, 0, 0.12)',
            border: `1px solid ${accentColor}44`,
            color: isEnglish ? '#cbd5e1' : '#f7f0d5',
            fontSize: 17,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            flexDirection: 'column',
          }}
        >
          <span>({homePenaltyScore}) - ({awayPenaltyScore})</span>
          <span
            style={{
              marginTop: 2,
              color: isEnglish ? '#94a3b8' : '#c0ccd8',
              fontSize: 9,
              lineHeight: 1,
              letterSpacing: 1.4,
            }}
          >
            PEN
          </span>
        </span>
      ) : null}
    </div>
  );
};

const LegacyPredictionRow = ({
  fixture,
  rowIndex,
}: {
  fixture: FixtureCard;
  rowIndex: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const anim = entranceStyle(frame, fps, rowStartFrame(rowIndex));

  return (
    <div
      style={{
        position: 'relative',
        height: 118,
        ...anim,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 88,
          right: 88,
          top: 20,
          height: 76,
          borderRadius: 26,
          background: 'linear-gradient(180deg, rgba(7,15,40,0.98), rgba(2,7,20,0.98))',
          boxShadow:
            '0 8px 18px rgba(0,0,0,0.36), inset 0 0 0 2px rgba(44,111,255,0.55), inset 0 -8px 18px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <RowGlow side="left" />
        <RowGlow side="right" />

        <TeamName align="left">{fixture.homeTeam}</TeamName>
        <ScoreBox
          homeScore={fixture.homeScore}
          awayScore={fixture.awayScore}
          hasPenalties={fixture.hasPenalties}
          homePenaltyScore={fixture.homePenaltyScore}
          awayPenaltyScore={fixture.awayPenaltyScore}
        />
        <TeamName align="right">{fixture.awayTeam}</TeamName>
      </div>

      <BadgeSlot side="left">
        <TeamBadge badge={fixture.homeBadge} size={96} isEliminated={fixture.homeEliminated} />
      </BadgeSlot>
      <BadgeSlot side="right">
        <TeamBadge badge={fixture.awayBadge} size={96} isEliminated={fixture.awayEliminated} />
      </BadgeSlot>
    </div>
  );
};

const BadgeSlot = ({
  side,
  children,
}: {
  side: 'left' | 'right';
  children: ReactNode;
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        [side]: 0,
        width: 120,
        height: 118,
        display: 'flex',
        alignItems: 'center',
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      {children}
    </div>
  );
};

const TeamName = ({
  align,
  children,
}: {
  align: 'left' | 'right';
  children: ReactNode;
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'left' ? 'flex-end' : 'flex-start',
        paddingLeft: align === 'left' ? 26 : 24,
        paddingRight: align === 'right' ? 26 : 24,
        textAlign: align,
        fontSize: 36,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: -1.1,
        textShadow: '0 2px 8px rgba(0,0,0,0.72)',
      }}
    >
      {children}
    </div>
  );
};

const ScoreBox = ({
  homeScore,
  awayScore,
  hasPenalties,
  homePenaltyScore,
  awayPenaltyScore,
}: {
  homeScore: number | null;
  awayScore: number | null;
  hasPenalties?: boolean;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
}) => {
  const showPrediction = homeScore === null || awayScore === null;
  const showPenaltyScore =
    Boolean(hasPenalties) &&
    typeof homePenaltyScore === 'number' &&
    typeof awayPenaltyScore === 'number';
  return (
    <div
      style={{
        width: 236,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(20,12,26,0.96), rgba(10,6,14,0.96))',
        clipPath: 'polygon(14% 0, 86% 0, 100% 100%, 0 100%)',
        boxShadow:
          'inset 0 0 0 2px rgba(255, 192, 78, 0.75), 0 0 16px rgba(255, 192, 78, 0.22)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255, 191, 83, 0.08), transparent)',
        }}
      />
      {showPrediction ? (
        <span
          style={{
            fontSize: 44,
            lineHeight: 1,
            fontWeight: 900,
            color: '#f7f0d5',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          VS
        </span>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: showPenaltyScore ? 50 : 62,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: -2,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {homeScore}
            </span>
            <span
              style={{
                fontSize: showPenaltyScore ? 42 : 52,
                lineHeight: 1,
                fontWeight: 900,
                color: '#7f6dc5',
                padding: '0 12px',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              -
            </span>
            <span
              style={{
                fontSize: showPenaltyScore ? 50 : 62,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: -2,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {awayScore}
            </span>
          </div>
          {showPenaltyScore ? (
            <div
              style={{
                marginTop: 3,
                padding: '3px 9px',
                borderRadius: 999,
                background: 'rgba(255, 192, 78, 0.14)',
                color: '#f7f0d5',
                border: '1px solid rgba(255, 192, 78, 0.38)',
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span>({homePenaltyScore}) - ({awayPenaltyScore})</span>
              <span
                style={{
                  marginTop: 2,
                  color: '#c0ccd8',
                  fontSize: 8,
                  lineHeight: 1,
                  letterSpacing: 1.2,
                }}
              >
                PEN
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

const RowGlow = ({side}: {side: 'left' | 'right'}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        [side]: 18,
        width: 108,
        borderRadius: 24,
        background:
          side === 'left'
            ? 'radial-gradient(circle at left center, rgba(34, 137, 255, 0.85), transparent 68%)'
            : 'radial-gradient(circle at right center, rgba(34, 137, 255, 0.85), transparent 68%)',
        opacity: 0.9,
      }}
    />
  );
};

type TeamBadgeSpec = FixtureCard['homeBadge'];

const TeamBadge = ({
  badge,
  size,
  isEliminated = false,
}: {
  badge: TeamBadgeSpec;
  size: number;
  isEliminated?: boolean;
}) => {
  if (badge.logoPath) {
    const logoAsset = staticFile(badge.logoPath.replace(/^\//, ''));
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: isEliminated
            ? 'grayscale(1) saturate(0.1) opacity(0.45) drop-shadow(0 8px 14px rgba(0,0,0,0.25))'
            : 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))',
        }}
      >
        <Img
          src={logoAsset}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        color: isEliminated ? '#8794a2' : '#ffffff',
        fontSize: Math.max(18, Math.round(size * 0.27)),
        fontWeight: 900,
        filter: isEliminated ? 'grayscale(1) opacity(0.55)' : undefined,
      }}
    >
      {badge.label}
    </div>
  );
};

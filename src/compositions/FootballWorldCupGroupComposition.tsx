import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CSSProperties} from 'react';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {FootballColdOpen} from '../components/FootballColdOpen';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  HEADER_STAGGER_FRAMES,
  ROW_STAGGER_FRAMES,
  ROWS_START_FRAME,
  entranceStyle,
  fadeInStyle,
  footerStartFrame,
  headerEntranceStyle,
  rowStartFrame,
} from '../lib/animations';
import type {
  FootballColdOpenData,
  TeamBadge,
  WorldCupGroupResult,
  WorldCupGroupRow,
  WorldCupNextMatch,
} from '../lib/types';

type FootballWorldCupGroupCompositionProps = {
  titleLabel: string;
  groupLabel: string;
  tableLabels: {
    pos: string;
    team: string;
    gd: string;
    pts: string;
  };
  nextMatchesLabel: string;
  lastResultsLabel?: string;
  qualificationLegend?: {
    direct: string;
    bestThird: string;
  };
  groupMatchSectionMode?: 'next-only' | 'mixed' | 'results-only';
  ctaText: string;
  rows: WorldCupGroupRow[];
  nextMatches: WorldCupNextMatch[];
  lastResults?: WorldCupGroupResult[];
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

// Standings rows: 4 rows starting at ROWS_START_FRAME.
// After the last row settles (~12 frames after it starts), the matches section begins.
const STANDINGS_ROW_COUNT = 4;
const MATCHES_SECTION_START = rowStartFrame(STANDINGS_ROW_COUNT) + 14;

const normalizeWorldCupTeamName = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bkorea republic\b/g, 'south korea')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const FootballWorldCupGroupComposition = ({
  titleLabel,
  groupLabel,
  tableLabels,
  nextMatchesLabel,
  lastResultsLabel,
  qualificationLegend,
  groupMatchSectionMode,
  ctaText,
  rows,
  nextMatches,
  lastResults,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
}: FootballWorldCupGroupCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const resolvedMatchMode =
    groupMatchSectionMode ??
    ((lastResults?.length ?? 0) === 0
      ? 'next-only'
      : (nextMatches?.length ?? 0) === 0
        ? 'results-only'
        : 'mixed');
  const groupTeamNames = new Set(rows.map((row) => normalizeWorldCupTeamName(row.team)));
  const belongsToCurrentGroup = (match: {homeTeam: string; awayTeam: string}) =>
    groupTeamNames.has(normalizeWorldCupTeamName(match.homeTeam)) &&
    groupTeamNames.has(normalizeWorldCupTeamName(match.awayTeam));
  const visibleLastResults =
    resolvedMatchMode === 'next-only'
      ? []
      : (lastResults ?? []).filter(belongsToCurrentGroup).slice(0, 2);
  const visibleNextMatches =
    resolvedMatchMode === 'results-only'
      ? []
      : (nextMatches ?? []).filter(belongsToCurrentGroup).slice(0, 2);
  const matchRowCount = visibleLastResults.length + visibleNextMatches.length;

  const chipAnim = headerEntranceStyle(frame, fps, 0);
  const titleAnim = headerEntranceStyle(frame, fps, HEADER_STAGGER_FRAMES);
  const matchesSectionAnim = fadeInStyle(frame, fps, MATCHES_SECTION_START);
  const footerAnim = fadeInStyle(
    frame,
    fps,
    footerStartFrame(STANDINGS_ROW_COUNT + Math.max(2, matchRowCount))
  );

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
        background: '#0b0d12',
      }}
    >
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <VoiceoverBed voiceoverPath={voiceoverPath} />
      <CompetitionAccentRail accentColor="#F0D500" />
      <FootballColdOpen
        accentColor="#F0D500"
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
      />
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
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '40px 28px 120px 72px',
        }}
      >
        {/* Animated header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
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
                fontFamily: '"Barlow", "Arial", sans-serif',
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {groupLabel}
            </div>
          </div>

          <div
            style={{
              fontSize: 96,
              lineHeight: 0.92,
              fontWeight: 900,
              letterSpacing: -2.4,
              textTransform: 'uppercase',
              color: '#F0D500',
              ...titleAnim,
            }}
          >
            {titleLabel}
          </div>
        </div>

        {/* Standings table */}
        <div style={{marginTop: 34}}>
          <TableHeader labels={tableLabels} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 16,
            }}
          >
            {rows.slice(0, 4).map((row, index) => (
              <StandingsRow
                key={`${row.rank}-${row.team}`}
                row={row}
                frame={frame}
                fps={fps}
                rowIndex={index}
              />
            ))}
          </div>
        </div>

        <QualificationLegend
          labels={
            qualificationLegend ?? {
              direct: '1st and 2nd advance',
              bestThird: '8 best third-place teams',
            }
          }
          style={matchesSectionAnim}
        />

        {/* Group activity — fades in after standings have settled */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            ...matchesSectionAnim,
          }}
        >
          {visibleLastResults.length > 0 ? (
            <>
              <ActivitySectionTitle label={lastResultsLabel ?? 'Last Results'} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {visibleLastResults.map((match, index) => (
                  <ResultRow
                    key={`${match.homeTeam}-${match.awayTeam}-${index}`}
                    match={match}
                    frame={frame}
                    fps={fps}
                    rowIndex={index}
                    baseFrame={MATCHES_SECTION_START + 6}
                  />
                ))}
              </div>
            </>
          ) : null}

          {visibleNextMatches.length > 0 ? (
            <>
              <ActivitySectionTitle label={nextMatchesLabel} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {visibleNextMatches.map((match, index) => (
                  <MatchRow
                    key={`${match.homeTeam}-${match.awayTeam}-${index}`}
                    match={match}
                    frame={frame}
                    fps={fps}
                    rowIndex={index + visibleLastResults.length}
                    baseFrame={MATCHES_SECTION_START + 6}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            ...footerAnim,
          }}
        >
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: 560,
              padding: '16px 24px 14px',
              borderRadius: 20,
              background: '#0f1318',
              border: '2px solid #F0D500',
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {ctaText}
          </div>

          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ActivitySectionTitle = ({label}: {label: string}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: '"Barlow", "Arial", sans-serif',
      fontSize: 20,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontWeight: 600,
      color: '#3a5060',
    }}
  >
    <div style={{width: 48, height: 4, borderRadius: 999, background: '#F0D500'}} />
    <div>{label}</div>
  </div>
);

const TableHeader = ({
  labels,
}: {
  labels: {pos: string; team: string; gd: string; pts: string};
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '96px minmax(0, 1fr) 88px 96px',
      alignItems: 'center',
      padding: '0 16px',
      fontFamily: '"Barlow", "Arial", sans-serif',
      fontSize: 20,
      lineHeight: 1,
      fontWeight: 600,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: '#3a5060',
    }}
  >
    <div>{labels.pos}</div>
    <div>{labels.team}</div>
    <div style={{textAlign: 'center'}}>{labels.gd}</div>
    <div style={{textAlign: 'center'}}>{labels.pts}</div>
  </div>
);

const QualificationLegend = ({
  labels,
  style,
}: {
  labels: {direct: string; bestThird: string};
  style: CSSProperties;
}) => (
  <div
    style={{
      marginTop: 24,
      minHeight: 42,
      padding: '0 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      fontFamily: '"Barlow", "Arial", sans-serif',
      fontSize: 18,
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: '#c0ccd8',
      ...style,
    }}
  >
    <LegendItem color="#27AE60" label={labels.direct} />
    <LegendItem color="#F0D500" label={labels.bestThird} />
  </div>
);

const LegendItem = ({color, label}: {color: string; label: string}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
    <div
      style={{
        width: 34,
        height: 6,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 14px ${color}66`,
      }}
    />
    <div>{label}</div>
  </div>
);

const StandingsRow = ({
  row,
  frame,
  fps,
  rowIndex,
}: {
  row: WorldCupGroupRow;
  frame: number;
  fps: number;
  rowIndex: number;
}) => {
  const qualifiesDirectly = row.rank <= 2;
  const qualifiesAsBestThird = row.rank === 3 && row.qualifiesAsBestThird;
  const background = qualifiesDirectly
    ? '#0b1409'
    : qualifiesAsBestThird
      ? '#171406'
      : '#140808';
  const railColor = qualifiesDirectly ? '#27AE60' : qualifiesAsBestThird ? '#F0D500' : '#E74C3C';
  const pointsColor = qualifiesDirectly || qualifiesAsBestThird ? '#F0D500' : '#E74C3C';
  const anim = entranceStyle(frame, fps, rowStartFrame(rowIndex));

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr) 88px 96px',
        alignItems: 'center',
        minHeight: 120,
        padding: '0 16px',
        borderRadius: 12,
        background,
        borderLeft: `8px solid ${railColor}`,
        ...anim,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            background: '#141c24',
            color: railColor,
            fontSize: 40,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          {row.rank}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          minWidth: 0,
        }}
      >
        <Badge badge={row.badge} size={58} />
        <div
          style={{
            fontSize: 34,
            lineHeight: 0.95,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.team}
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 42,
          lineHeight: 1,
          fontWeight: 700,
          color: '#c0ccd8',
        }}
      >
        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            minWidth: 72,
            height: 80,
            padding: '0 12px',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: '#0f1318',
            color: pointsColor,
            fontSize: 44,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          {row.points}
        </div>
      </div>
    </div>
  );
};

const MatchRow = ({
  match,
  frame,
  fps,
  rowIndex,
  baseFrame,
}: {
  match: WorldCupNextMatch;
  frame: number;
  fps: number;
  rowIndex: number;
  baseFrame: number;
}) => {
  const anim = entranceStyle(frame, fps, baseFrame + rowIndex * ROW_STAGGER_FRAMES);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 136px minmax(0, 1fr)',
        alignItems: 'center',
        minHeight: 92,
        padding: '0 18px',
        borderRadius: 16,
        background: '#0f1318',
        borderLeft: '8px solid #141c24',
        ...anim,
      }}
    >
      <MatchTeam name={match.homeTeam} badge={match.homeBadge} align="left" />
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 40,
            lineHeight: 1,
            fontWeight: 900,
            color: '#F0D500',
            textTransform: 'uppercase',
          }}
        >
          VS
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.05,
            fontFamily: '"Barlow", "Arial", sans-serif',
            fontWeight: 600,
            letterSpacing: 1.2,
            color: '#3a5060',
            textTransform: 'uppercase',
          }}
        >
          {match.dateLabel}
        </div>
      </div>
      <MatchTeam name={match.awayTeam} badge={match.awayBadge} align="right" />
    </div>
  );
};

const ResultRow = ({
  match,
  frame,
  fps,
  rowIndex,
  baseFrame,
}: {
  match: WorldCupGroupResult;
  frame: number;
  fps: number;
  rowIndex: number;
  baseFrame: number;
}) => {
  const anim = entranceStyle(frame, fps, baseFrame + rowIndex * ROW_STAGGER_FRAMES);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 126px minmax(0, 1fr)',
        alignItems: 'center',
        minHeight: 92,
        padding: '0 18px',
        borderRadius: 16,
        background: '#101820',
        borderLeft: '8px solid #F0D500',
        ...anim,
      }}
    >
      <MatchTeam name={match.homeTeam} badge={match.homeBadge} align="left" />
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            minHeight: 52,
            borderRadius: 12,
            background: '#171006',
            border: '2px solid rgba(240,213,0,0.34)',
            color: '#F0D500',
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1,
            fontFamily: '"Barlow", "Arial", sans-serif',
            fontWeight: 600,
            letterSpacing: 1,
            color: '#4d6474',
            textTransform: 'uppercase',
          }}
        >
          {match.dateLabel}
        </div>
      </div>
      <MatchTeam name={match.awayTeam} badge={match.awayBadge} align="right" />
    </div>
  );
};

const MatchTeam = ({
  name,
  badge,
  align,
}: {
  name: string;
  badge: TeamBadge;
  align: 'left' | 'right';
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    }}
  >
    <Badge badge={badge} size={48} />
    <div
      style={{
        fontSize: 28,
        lineHeight: 0.96,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#ffffff',
        textAlign: align,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {name}
    </div>
  </div>
);

const Badge = ({badge, size}: {badge: TeamBadge; size: number}) => {
  if (badge.imagePath) {
    return (
      <Img
        src={staticFile(badge.imagePath.replace(/^\//, ''))}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.24))',
          flexShrink: 0,
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
        fontSize: Math.round(size * 0.68),
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {badge.label}
    </div>
  );
};

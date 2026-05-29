import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {FootballColdOpen} from '../components/FootballColdOpen';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  HEADER_STAGGER_FRAMES,
  accentWipeWidth,
  fadeInStyle,
  headerEntranceStyle,
  rowStartFrame,
} from '../lib/animations';
import type {
  FootballChannelProfile,
  FootballColdOpenData,
  LeagueConfig,
  SeasonFinalVerdictGroup,
  StandingRow,
} from '../lib/types';

type FootballSeasonFinalVerdictCompositionProps = {
  channelProfile?: FootballChannelProfile;
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  champion: StandingRow;
  qualificationGroups: SeasonFinalVerdictGroup[];
  relegationGroup: SeasonFinalVerdictGroup;
  leagueConfig?: LeagueConfig;
  brandName: string;
  brandLogoPath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
  ctaText?: string;
};

export const FootballSeasonFinalVerdictComposition = ({
  channelProfile = 'pt',
  leagueName,
  titleLabel,
  subtitleLabel,
  champion,
  qualificationGroups,
  relegationGroup,
  leagueConfig,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
  ctaText,
}: FootballSeasonFinalVerdictCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mainStartFrame = Math.round(fps * 1.55);
  const contentFrame = Math.max(0, frame - mainStartFrame);
  const mainOpacity = interpolate(frame, [mainStartFrame, mainStartFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const accentColor = leagueConfig?.accentColor ?? '#F0A500';
  const isEnglish = channelProfile === 'en';
  const headerAnim = headerEntranceStyle(contentFrame, fps, 0);
  const titleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES);
  const championAnim = fadeInStyle(contentFrame, fps, 20);
  const footerAnim = fadeInStyle(contentFrame, fps, 112);
  const shownQualificationGroups = qualificationGroups;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#f0f4f8',
        fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
        background:
          'radial-gradient(circle at 82% 16%, rgba(240,165,0,0.14), transparent 30%), linear-gradient(180deg, #0b0d12 0%, #07090d 100%)',
      }}
    >
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <VoiceoverBed voiceoverPath={voiceoverPath} />
      <FootballColdOpen
        accentColor={accentColor}
        secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
      />
      <AbsoluteFill style={{opacity: mainOpacity}}>
        <CompetitionAccentRail
          accentColor={accentColor}
          secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: accentWipeWidth(contentFrame),
            height: 8,
            background: accentColor,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            padding: '54px 124px 132px 88px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        <header style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div
            style={{
              ...headerAnim,
              color: accentColor,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 2.2,
              textTransform: 'uppercase',
            }}
          >
            {leagueName}
          </div>
          <div
            style={{
              ...titleAnim,
              color: '#f0f4f8',
              fontSize: 82,
              lineHeight: 0.86,
              fontWeight: 950,
              letterSpacing: -2.8,
              textTransform: 'uppercase',
            }}
          >
            {titleLabel}
          </div>
          <div
            style={{
              ...titleAnim,
              color: '#5f7284',
              fontSize: 34,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {subtitleLabel}
          </div>
        </header>

        <div style={{marginTop: 34, ...championAnim}}>
          <ChampionCard champion={champion} accentColor={accentColor} isEnglish={isEnglish} />
        </div>

        <div
          style={{
            marginTop: 38,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {shownQualificationGroups.map((group, groupIndex) => (
            <VerdictGroup
              key={group.key}
              group={group}
              rowOffset={groupIndex * 3}
              danger={false}
              timelineFrame={contentFrame}
            />
          ))}
          <VerdictGroup
            group={relegationGroup}
            rowOffset={shownQualificationGroups.length * 3}
            danger
            timelineFrame={contentFrame}
          />
        </div>

        <footer
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            ...footerAnim,
          }}
        >
          {ctaText ? (
            <div
              style={{
                maxWidth: 610,
                padding: '16px 24px 14px',
                borderRadius: 20,
                border: `2px solid ${accentColor}`,
                background: '#0f1318',
                color: '#ffffff',
                fontSize: 31,
                lineHeight: 1,
                fontWeight: 900,
                textTransform: 'uppercase',
              }}
            >
              {ctaText}
            </div>
          ) : (
            <div />
          )}
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </footer>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ChampionCard = ({
  champion,
  accentColor,
  isEnglish,
}: {
  champion: StandingRow;
  accentColor: string;
  isEnglish: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '112px 1fr auto',
      alignItems: 'center',
      gap: 22,
      minHeight: 178,
      padding: '24px 28px',
      borderRadius: 30,
      background:
        'linear-gradient(90deg, rgba(240,165,0,0.22), rgba(15,19,24,0.98) 48%, rgba(15,19,24,0.84))',
      border: `3px solid ${accentColor}`,
      boxShadow: `0 0 28px ${accentColor}26`,
    }}
  >
    <Badge badge={champion.badge} size={104} />
    <div>
      <div
        style={{
          color: accentColor,
          fontSize: 28,
          fontWeight: 950,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {isEnglish ? 'Champion' : 'Campeão'}
      </div>
      <div
        style={{
          color: '#ffffff',
          fontSize: 56,
          lineHeight: 0.92,
          fontWeight: 950,
          textTransform: 'uppercase',
        }}
      >
        {champion.team}
      </div>
    </div>
    <div style={{textAlign: 'right'}}>
      <div style={{color: accentColor, fontSize: 74, lineHeight: 0.86, fontWeight: 950}}>
        {champion.points}
      </div>
      <div
        style={{
          color: '#5f7284',
          fontSize: 22,
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        pts
      </div>
    </div>
  </div>
);

const VerdictGroup = ({
  group,
  rowOffset,
  danger,
  timelineFrame,
}: {
  group: SeasonFinalVerdictGroup;
  rowOffset: number;
  danger: boolean;
  timelineFrame: number;
}) => {
  const visibleEntries = group.entries.slice(0, danger ? 4 : 5);
  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 38,
            height: 5,
            borderRadius: 999,
            background: group.accentColor,
          }}
        />
        <span
          style={{
            color: danger ? '#E74C3C' : group.accentColor,
            fontSize: 27,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
          }}
        >
          {group.label}
        </span>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 12}}>
        {visibleEntries.map((entry, index) => (
          <VerdictRow
            key={`${group.key}-${entry.rank}-${entry.team}`}
            row={entry}
            accentColor={danger ? '#E74C3C' : group.accentColor}
            rowIndex={rowOffset + index}
            danger={danger}
            timelineFrame={timelineFrame}
          />
        ))}
      </div>
    </section>
  );
};

const VerdictRow = ({
  row,
  accentColor,
  rowIndex,
  danger,
  timelineFrame,
}: {
  row: StandingRow;
  accentColor: string;
  rowIndex: number;
  danger: boolean;
  timelineFrame: number;
}) => {
  const {fps} = useVideoConfig();
  const anim = fadeInStyle(timelineFrame, fps, rowStartFrame(rowIndex));

  return (
    <div
      style={{
        ...anim,
        display: 'grid',
        gridTemplateColumns: '62px 58px 1fr auto',
        alignItems: 'center',
        gap: 16,
        minHeight: 78,
        padding: '12px 18px',
        borderRadius: 20,
        background: danger ? 'rgba(20,8,8,0.94)' : 'rgba(15,19,24,0.94)',
        borderLeft: `7px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 35,
          lineHeight: 1,
          fontWeight: 950,
          textAlign: 'center',
        }}
      >
        {row.rank}
      </div>
      <Badge badge={row.badge} size={54} />
      <div
        style={{
          minWidth: 0,
          color: '#f0f4f8',
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 900,
          textTransform: 'uppercase',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {row.team}
      </div>
      <div style={{color: accentColor, fontSize: 38, fontWeight: 950}}>{row.points}</div>
    </div>
  );
};

const Badge = ({badge, size}: {badge: StandingRow['badge']; size: number}) => {
  const source = badge.logoPath ?? badge.imagePath;
  if (source) {
    return (
      <Img
        src={staticFile(source.replace(/^\//, ''))}
        style={{width: size, height: size, objectFit: 'contain'}}
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
        borderRadius: size / 2,
        background: '#141c24',
        color: '#ffffff',
        fontSize: Math.max(13, size * 0.28),
        fontWeight: 950,
      }}
    >
      {badge.label}
    </div>
  );
};

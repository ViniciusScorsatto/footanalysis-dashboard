import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
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
import {StandingsLegend} from '../components/StandingsLegend';
import {StandingsTable} from '../components/StandingsTable';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  HEADER_STAGGER_FRAMES,
  accentWipeWidth,
  fadeInStyle,
  footerStartFrame,
  headerEntranceStyle,
} from '../lib/animations';
import type {
  FootballChannelProfile,
  FootballColdOpenData,
  FootballLanguageProfile,
  LeagueConfig,
  StandingRow,
  StandingsZoneConfig,
} from '../lib/types';

type FootballStandingsCompositionProps = {
  channelProfile?: FootballChannelProfile;
  languageProfile?: FootballLanguageProfile;
  leagueName: string;
  standingsLabel: string;
  rows: StandingRow[];
  leagueConfig?: LeagueConfig;
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  voiceoverPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
  ctaText?: string;
  presentation?: 'animated' | 'static';
};

// The 36-team Champions League and Europa League phases are presented as two
// consecutive screens. Other competitions retain their original single-table layout.
const STANDINGS_PAGE_SIZE = 18;

const getFallbackZones = (rowCount: number): StandingsZoneConfig[] => [
  {
    key: 'promoted',
    label: '1–2 Automatic Promotion',
    start: 1,
    end: 2,
    fill: 'linear-gradient(90deg, rgba(10, 132, 255, 0.34), rgba(10, 132, 255, 0.10) 62%, rgba(0,0,0,0.04))',
    accent: 'rgba(10, 132, 255, 0.72)',
    textColor: '#0A84FF',
  },
  {
    key: 'promotion-playoffs',
    label: '3–8 Promotion Play-offs',
    start: 3,
    end: 8,
    fill: 'linear-gradient(90deg, rgba(39, 174, 96, 0.34), rgba(39, 174, 96, 0.10) 62%, rgba(0,0,0,0.04))',
    accent: 'rgba(39, 174, 96, 0.72)',
    textColor: '#27AE60',
  },
  {
    key: 'relegation',
    label: `${Math.max(rowCount - 2, 1)}–${rowCount} Relegated`,
    start: Math.max(rowCount - 2, 1),
    end: rowCount,
    fill: 'linear-gradient(90deg, rgba(224, 48, 48, 0.34), rgba(224, 48, 48, 0.10) 62%, rgba(0,0,0,0.04))',
    accent: 'rgba(231, 76, 60, 0.72)',
    textColor: '#E74C3C',
  },
];

export const FootballStandingsComposition = ({
  channelProfile = 'pt',
  leagueName,
  standingsLabel,
  rows,
  leagueConfig,
  brandName,
  brandLogoPath,
  backgroundImagePath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
  ctaText,
  presentation = 'animated',
}: FootballStandingsCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const isStatic = presentation === 'static';
  const contentStartFrame = isStatic ? 0 : SHORT_OPENING_DURATION_FRAMES;
  const contentFrame = isStatic
    ? 999
    : Math.max(0, frame - contentStartFrame) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const isEnglish = channelProfile === 'en';
  const normalizedLeagueName = leagueName.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const isChampionsLeague =
    leagueConfig?.leagueId === 2 || normalizedLeagueName.includes('champions league');
  const isEuropaLeague =
    leagueConfig?.leagueId === 3 || normalizedLeagueName.includes('europa league');
  const isConferenceLeague =
    leagueConfig?.leagueId === 848 || normalizedLeagueName.includes('conference league');
  const isSplitStandingsCompetition = isChampionsLeague || isEuropaLeague || isConferenceLeague;
  const pageCount = isSplitStandingsCompetition
    ? Math.max(1, Math.ceil(rows.length / STANDINGS_PAGE_SIZE))
    : 1;
  const pageDuration = Math.max(
    1,
    Math.floor((durationInFrames - contentStartFrame) / pageCount),
  );
  const pageIndex =
    pageCount > 1
      ? Math.min(
          pageCount - 1,
          Math.floor(Math.max(0, frame - contentStartFrame) / pageDuration),
        )
      : 0;
  const visibleRows = isSplitStandingsCompetition
    ? rows.slice(
        pageIndex * STANDINGS_PAGE_SIZE,
        (pageIndex + 1) * STANDINGS_PAGE_SIZE,
      )
    : rows;

  const standingsConfig = leagueConfig?.standings;
  const safeArea = standingsConfig?.safeArea ?? {left: 40, right: 120};
  const contentLeftPadding = 72;
  const tableLeftPadding = Math.max(24, safeArea.left - (contentLeftPadding - 28));
  const zones = standingsConfig?.zones?.length
    ? standingsConfig.zones
    : getFallbackZones(rows.length);
  const accentColor = leagueConfig?.accentColor ?? '#F0A500';

  const chipAnim = headerEntranceStyle(contentFrame, fps, 0);
  const titleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES);
  const labelAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES * 2);
  const footerAnim = fadeInStyle(contentFrame, fps, footerStartFrame(rows.length));

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
        template="standings"
        accentColor={accentColor}
        opacity={0.5}
      />
      {!isStatic ? (
        <FootballShortOpening
          template="standings"
          channelProfile={channelProfile}
          leagueName={leagueName}
          roundLabel={standingsLabel}
          rows={rows}
          accentColor={accentColor}
          secondaryAccentColor={leagueConfig?.secondaryAccentColor}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          introTitle={introTitle}
          introSubtitle={introSubtitle}
          hookText={hookText}
          coldOpenData={coldOpenData}
        />
      ) : null}
      <Sequence from={contentStartFrame}>
        <VoiceoverBed voiceoverPath={isStatic ? undefined : voiceoverPath} />
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
            height: 6,
            background: accentColor,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: `40px 28px 136px ${contentLeftPadding}px`,
          }}
        >
        <div
          style={{
            height: isStatic ? 88 : 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            ...labelAnim,
          }}
        >
          {isStatic ? <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} /> : null}
        </div>

        {/* Animated header */}
        <StandingsHeader
          channelProfile={channelProfile}
          isStatic={isStatic}
          leagueName={leagueName}
          standingsLabel={standingsLabel}
          pageIndex={pageIndex}
          pageCount={pageCount}
          accentColor={accentColor}
          chipAnim={chipAnim}
          titleAnim={titleAnim}
          labelAnim={labelAnim}
        />

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            marginTop: 24,
            padding: `0 ${safeArea.right}px 0 ${tableLeftPadding}px`,
          }}
        >
          <StandingsTable
            rows={visibleRows}
            zones={zones}
            channelProfile={channelProfile}
            disableAnimation={isStatic}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: `0 ${safeArea.right}px 0 ${tableLeftPadding}px`,
          }}
        >
          <StandingsLegend zones={zones} channelProfile={channelProfile} />
        </div>

        {!isStatic ? (
          <div
            style={{
              marginTop: 'auto',
              paddingLeft: tableLeftPadding,
              paddingRight: safeArea.right,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 32,
              ...footerAnim,
            }}
          >
            {ctaText?.trim() ? (
              <div
                style={{
                  maxWidth: 560,
                  padding: '16px 24px 14px',
                  borderRadius: 20,
                  background: '#0f1318',
                  border: `2px solid ${accentColor}`,
                  boxShadow: isEnglish ? 'none' : `0 0 20px ${accentColor}22`,
                  color: '#ffffff',
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {ctaText}
              </div>
            ) : (
              <div />
            )}
            <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
          </div>
        ) : null}

        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const StandingsHeader = ({
  channelProfile,
  isStatic,
  leagueName,
  standingsLabel,
  pageIndex,
  pageCount,
  accentColor,
  chipAnim,
  titleAnim,
  labelAnim,
}: {
  channelProfile: FootballChannelProfile;
  isStatic: boolean;
  leagueName: string;
  standingsLabel: string;
  pageIndex: number;
  pageCount: number;
  accentColor: string;
  chipAnim: React.CSSProperties;
  titleAnim: React.CSSProperties;
  labelAnim: React.CSSProperties;
}) => {
  const isEnglish = channelProfile === 'en';
  const useLeagueAccent = isStatic && isEnglish;
  const displayStandingsLabel = resolveStandingsLabel(standingsLabel, channelProfile);
  const pageLabel = pageCount > 1 ? ` · ${pageIndex + 1}/${pageCount}` : '';

  return (
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
            background: useLeagueAccent ? `${accentColor}14` : isEnglish ? '#141c24' : '#0f1318',
            border: useLeagueAccent
              ? `1px solid ${accentColor}88`
              : isEnglish
                ? '1px solid #1e2a3a'
                : 'none',
            borderLeft: useLeagueAccent
              ? `7px solid ${accentColor}`
              : isEnglish
                ? '1px solid #1e2a3a'
                : `8px solid ${accentColor}`,
            color: useLeagueAccent ? accentColor : isEnglish ? '#4a6070' : accentColor,
            boxShadow: useLeagueAccent ? `0 0 20px ${accentColor}20` : undefined,
            fontFamily: TEASER_LABEL_FONT,
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {leagueName}
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
          color: isEnglish ? '#f0f4f8' : accentColor,
          ...titleAnim,
        }}
      >
        {isEnglish ? 'Standings' : 'Tabela'}
      </div>

      <div
        style={{
          color: useLeagueAccent ? accentColor : isEnglish ? '#4a6070' : '#3a5060',
          fontSize: 56,
          lineHeight: 1,
          fontWeight: 600,
          fontFamily: TEASER_LABEL_FONT,
          textTransform: 'uppercase',
          ...labelAnim,
        }}
      >
        {displayStandingsLabel}
        {pageLabel}
      </div>
    </div>
  );
};

const resolveStandingsLabel = (
  standingsLabel: string,
  channelProfile: FootballChannelProfile
) => {
  const normalized = standingsLabel
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

  if (channelProfile === 'en' && normalized === 'classificacao atual') {
    return 'Current Table';
  }

  return standingsLabel;
};

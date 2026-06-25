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
};

const fallbackZones: StandingsZoneConfig[] = [
  {
    key: 'top-three',
    label: 'Top 3',
    start: 1,
    end: 3,
    fill: 'linear-gradient(90deg, rgba(58, 196, 88, 0.84), rgba(58, 196, 88, 0.28) 62%, rgba(0,0,0,0.04))',
    accent: 'rgba(86, 214, 120, 0.62)',
  },
  {
    key: 'bottom-three',
    label: 'Bottom 3',
    start: 18,
    end: 20,
    fill: 'linear-gradient(90deg, rgba(224, 48, 48, 0.84), rgba(224, 48, 48, 0.28) 62%, rgba(0,0,0,0.04))',
    accent: 'rgba(255, 90, 90, 0.56)',
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
}: FootballStandingsCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const isEnglish = channelProfile === 'en';

  const standingsConfig = leagueConfig?.standings;
  const safeArea = standingsConfig?.safeArea ?? {left: 40, right: 120};
  const contentLeftPadding = 72;
  const tableLeftPadding = Math.max(24, safeArea.left - (contentLeftPadding - 28));
  const zones = standingsConfig?.zones?.length ? standingsConfig.zones : fallbackZones;
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
      <Sequence from={SHORT_OPENING_DURATION_FRAMES}>
        <VoiceoverBed voiceoverPath={voiceoverPath} />
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
        {/* Animated header */}
        <StandingsHeader
          channelProfile={channelProfile}
          leagueName={leagueName}
          standingsLabel={standingsLabel}
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
          <StandingsTable rows={rows} zones={zones} channelProfile={channelProfile} />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: `0 ${safeArea.right}px 0 ${tableLeftPadding}px`,
          }}
        >
          <StandingsLegend zones={zones} channelProfile={channelProfile} />
        </div>

        {/* Animated footer */}
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
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const StandingsHeader = ({
  channelProfile,
  leagueName,
  standingsLabel,
  accentColor,
  chipAnim,
  titleAnim,
  labelAnim,
}: {
  channelProfile: FootballChannelProfile;
  leagueName: string;
  standingsLabel: string;
  accentColor: string;
  chipAnim: React.CSSProperties;
  titleAnim: React.CSSProperties;
  labelAnim: React.CSSProperties;
}) => {
  const isEnglish = channelProfile === 'en';
  const displayStandingsLabel = resolveStandingsLabel(standingsLabel, channelProfile);

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
            background: isEnglish ? '#141c24' : '#0f1318',
            border: isEnglish ? '1px solid #1e2a3a' : 'none',
            borderLeft: isEnglish ? '1px solid #1e2a3a' : `8px solid ${accentColor}`,
            color: isEnglish ? '#4a6070' : accentColor,
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
          color: isEnglish ? '#4a6070' : '#3a5060',
          fontSize: 56,
          lineHeight: 1,
          fontWeight: 600,
          fontFamily: TEASER_LABEL_FONT,
          textTransform: 'uppercase',
          ...labelAnim,
        }}
      >
        {displayStandingsLabel}
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

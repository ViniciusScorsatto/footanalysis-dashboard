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
} from '../components/FootballShortTeaser';
import {ResultRow} from '../components/ResultRow';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  HEADER_STAGGER_FRAMES,
  accentWipeWidth,
  fadeInStyle,
  footerStartFrame,
  headerEntranceStyle,
} from '../lib/animations';
import type {
  FixtureCard,
  FootballChannelProfile,
  FootballColdOpenData,
  FootballLanguageProfile,
  LeagueConfig,
} from '../lib/types';

type FootballFixturesCompositionProps = {
  channelProfile?: FootballChannelProfile;
  languageProfile?: FootballLanguageProfile;
  leagueName: string;
  roundLabel: string;
  fixtures: FixtureCard[];
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
  leagueConfig?: LeagueConfig;
  ctaText?: string;
  variant: 'results' | 'next-games' | 'predictions';
};

export const FootballFixturesComposition = ({
  channelProfile = 'pt',
  languageProfile = 'pt-br',
  leagueName,
  roundLabel,
  fixtures,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  voiceoverPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
  leagueConfig,
  ctaText,
  variant,
}: FootballFixturesCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;

  const isEnglish = channelProfile === 'en';
  const accentColor = leagueConfig?.accentColor ?? '#F0A500';
  const topSafePadding = variant === 'results' ? 112 : 96;
  const sideSafeLeft = 72;
  const sideSafeRight = 156;
  const footerSafeBottom = variant === 'results' ? 248 : 228;
  const footerSafeRight = 168;
  const titleText =
    variant === 'results'
      ? isEnglish
        ? 'Results'
        : 'Resultados'
      : variant === 'next-games'
        ? isEnglish
          ? 'Fixtures'
          : 'Próximos Jogos'
      : isEnglish
        ? 'Predictions'
        : 'Palpites';
  const titleColor = isEnglish ? '#f0f4f8' : accentColor;
  const subtitleColor = isEnglish ? '#4a6070' : '#3a5060';
  const backgroundColor = '#0b0d12';
  const isCompactFixtureLayout = fixtures.length >= 6;
  const isExpandedFixtureLayout = fixtures.length > 0 && fixtures.length < 6;
  const fixtureListGap = isExpandedFixtureLayout
    ? fixtures.length <= 2
      ? 28
      : fixtures.length <= 3
        ? 22
        : 16
    : 16;

  const chipAnim = headerEntranceStyle(contentFrame, fps, 0);
  const titleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES);
  const roundAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES * 2);
  const footerAnim = fadeInStyle(contentFrame, fps, footerStartFrame(fixtures.length));
  const ctaAccentColor = isEnglish && variant !== 'results' ? '#0A84FF' : accentColor;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: backgroundColor,
        color: '#ffffff',
        fontFamily: TEASER_NUMBER_FONT,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop
        template={variant}
        variant={variant}
        accentColor={accentColor}
        opacity={0.5}
      />
      <FootballShortOpening
        template={variant}
        variant={variant}
        channelProfile={channelProfile}
        leagueName={leagueName}
        roundLabel={roundLabel}
        fixtures={fixtures}
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
            padding: `${topSafePadding}px ${sideSafeRight}px ${footerSafeBottom}px ${sideSafeLeft}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginBottom: 28,
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
                color: titleColor,
                ...titleAnim,
              }}
            >
              {titleText}
            </div>

            <div
              style={{
                fontSize: 56,
                lineHeight: 1,
                fontWeight: 600,
                fontFamily: TEASER_LABEL_FONT,
                textTransform: 'uppercase',
                color: subtitleColor,
                ...roundAnim,
              }}
            >
              {roundLabel}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: fixtureListGap,
              paddingRight: 4,
              flex: isExpandedFixtureLayout ? 1 : undefined,
              justifyContent: isExpandedFixtureLayout ? 'center' : undefined,
              marginTop: isExpandedFixtureLayout ? 10 : undefined,
              marginBottom: isExpandedFixtureLayout ? 24 : undefined,
            }}
          >
            {fixtures.map((fixture, index) => (
              <ResultRow
                key={fixture.fixtureId ?? `${fixture.homeTeam}-${fixture.awayTeam}`}
                fixture={fixture}
                variant={variant}
                rowIndex={index}
                accentColor={accentColor}
                channelProfile={channelProfile}
                leagueId={leagueConfig?.leagueId}
                density={isCompactFixtureLayout ? 'compact' : 'expanded'}
                fixtureCount={fixtures.length}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 32,
              paddingRight: footerSafeRight,
              ...footerAnim,
            }}
          >
            <FooterCta text={ctaText} accentColor={ctaAccentColor} />
            <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const FooterCta = ({
  text,
  accentColor,
}: {
  text?: string;
  accentColor: string;
}) => {
  if (!text?.trim()) {
    return <div />;
  }

  return (
    <div
      style={{
        maxWidth: 620,
        marginBottom: 8,
        padding: '18px 24px 16px',
        borderRadius: 20,
        background: '#0f1318',
        border: `2px solid ${accentColor}`,
        color: '#ffffff',
        fontSize: 34,
        lineHeight: 1,
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        boxShadow: `0 0 20px ${accentColor}22`,
      }}
    >
      {text}
    </div>
  );
};

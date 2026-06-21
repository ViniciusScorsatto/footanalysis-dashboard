import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
import {accentWipeWidth, fadeInStyle, headerEntranceStyle} from '../lib/animations';
import type {
  FixtureCard,
  FootballChannelProfile,
  FootballColdOpenData,
  LeagueConfig,
  TeamBadge,
} from '../lib/types';

type FootballChampionFinalCompositionProps = {
  channelProfile?: FootballChannelProfile;
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  seasonLabel: string;
  championTeam: string;
  championBadge: TeamBadge;
  finalFixture?: FixtureCard;
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

export const FootballChampionFinalComposition = ({
  channelProfile = 'pt',
  leagueName,
  titleLabel,
  subtitleLabel,
  seasonLabel,
  championTeam,
  championBadge,
  finalFixture,
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
}: FootballChampionFinalCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const accentColor = leagueConfig?.accentColor ?? (channelProfile === 'en' ? '#0A84FF' : '#F0A500');
  const mainOpacity = interpolate(contentFrame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const crestScale = interpolate(contentFrame, [0, 22], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#f0f4f8',
        fontFamily: TEASER_NUMBER_FONT,
        background:
          `radial-gradient(circle at 50% 26%, ${accentColor}3d, transparent 29%), ` +
          `radial-gradient(circle at 82% 70%, ${accentColor}22, transparent 28%), #0b0d12`,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop
        template="champion-final"
        accentColor={accentColor}
        opacity={0.5}
      />
      <FootballShortOpening
        template="champion-final"
        channelProfile={channelProfile}
        leagueName={leagueName}
        titleLabel={titleLabel}
        subtitleLabel={subtitleLabel}
        seasonLabel={seasonLabel}
        championTeam={championTeam}
        championBadge={championBadge}
        finalFixture={finalFixture}
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
      <AbsoluteFill style={{opacity: mainOpacity}}>
        <CompetitionAccentRail
          accentColor={accentColor}
          secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0 0 auto 0',
            width: accentWipeWidth(contentFrame),
            height: 9,
            background: accentColor,
          }}
        />
        <CelebrationPattern accentColor={accentColor} />
        <div
          style={{
            position: 'relative',
            height: '100%',
            zIndex: 1,
            padding: '72px 132px 148px 96px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <header style={{...headerEntranceStyle(contentFrame, fps, 0), width: '100%'}}>
            <div
              style={{
                display: 'inline-flex',
                padding: '12px 24px 10px',
                border: `2px solid ${accentColor}`,
                borderRadius: 999,
                color: accentColor,
                fontFamily: TEASER_LABEL_FONT,
                fontSize: 25,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                background: '#0f1318',
              }}
            >
              {seasonLabel}
            </div>
            <div
              style={{
                marginTop: 24,
                color: '#f0f4f8',
                fontSize: 56,
                lineHeight: 0.98,
                fontWeight: 800,
                fontFamily: TEASER_LABEL_FONT,
                textTransform: 'uppercase',
              }}
            >
              {subtitleLabel || leagueName}
            </div>
          </header>

          <div
            style={{
              marginTop: 52,
              width: 570,
              height: 570,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              transform: `scale(${crestScale})`,
              ...fadeInStyle(contentFrame, fps, 10),
              background:
                `radial-gradient(circle, rgba(255,255,255,0.10), ${accentColor}28 40%, transparent 71%)`,
            }}
          >
            <div
              style={{
                width: 430,
                height: 430,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 96,
                border: `4px solid ${accentColor}`,
                background: 'linear-gradient(145deg, #141c24, #0b0d12)',
                boxShadow: `0 0 0 20px rgba(255,255,255,0.03), 0 28px 90px ${accentColor}42`,
              }}
            >
              <Badge badge={championBadge} size={320} />
            </div>
          </div>

          <div style={{marginTop: -12, ...headerEntranceStyle(contentFrame, fps, 18)}}>
            <div
              style={{
                color: accentColor,
                fontSize: 132,
                lineHeight: 0.82,
                fontWeight: 950,
                fontFamily: TEASER_HEADLINE_FONT,
                letterSpacing: 0,
                textTransform: 'uppercase',
                textShadow: `0 14px 42px ${accentColor}35`,
              }}
            >
              {titleLabel}
            </div>
            <div
              style={{
                marginTop: 24,
                color: '#ffffff',
                fontSize: 62,
                lineHeight: 0.94,
                fontWeight: 900,
                fontFamily: TEASER_HEADLINE_FONT,
                textTransform: 'uppercase',
              }}
            >
              {championTeam}
            </div>
          </div>

          {finalFixture ? (
            <div style={{marginTop: 48, width: '100%', ...fadeInStyle(contentFrame, fps, 36)}}>
              <FinalScore fixture={finalFixture} accentColor={accentColor} />
            </div>
          ) : null}

          <footer
            style={{
              marginTop: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
              ...fadeInStyle(contentFrame, fps, 70),
            }}
          >
            {ctaText ? (
              <div
                style={{
                  maxWidth: 580,
                  padding: '16px 24px 14px',
                  border: `2px solid ${accentColor}`,
                  borderRadius: 20,
                  background: '#0f1318',
                  color: '#f0f4f8',
                  fontSize: 30,
                  lineHeight: 1,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  textAlign: 'left',
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
      </Sequence>
    </AbsoluteFill>
  );
};

const CelebrationPattern = ({accentColor}: {accentColor: string}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.22,
        backgroundImage:
          'linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.12) 50%, transparent 50.5%), radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)',
        backgroundSize: '100% 100%, 42px 42px',
      }}
    />
    {[-1, 1].map((direction) => (
      <div
        key={direction}
        style={{
          position: 'absolute',
          top: 252,
          left: direction < 0 ? -120 : 'auto',
          right: direction > 0 ? -120 : 'auto',
          width: 420,
          height: 1180,
          border: `3px solid ${accentColor}`,
          borderRadius: 999,
          opacity: 0.18,
          transform: `rotate(${direction * 18}deg)`,
        }}
      />
    ))}
  </>
);

const Badge = ({badge, size}: {badge: TeamBadge; size: number}) => {
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
        fontSize: size * 0.24,
        fontWeight: 900,
      }}
    >
      {badge.label}
    </div>
  );
};

const FinalScore = ({fixture, accentColor}: {fixture: FixtureCard; accentColor: string}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 236px 1fr',
      alignItems: 'center',
      minHeight: 188,
      gap: 24,
      padding: '20px 32px',
      borderRadius: 34,
      border: '2px solid #1e2a3a',
      borderLeft: `10px solid ${accentColor}`,
      background: 'rgba(15,19,24,0.96)',
    }}
  >
    <Team team={fixture.homeTeam} badge={fixture.homeBadge} align="left" faded={fixture.homeEliminated} />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 72,
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        {fixture.homeScore ?? '-'} - {fixture.awayScore ?? '-'}
      </div>
      {fixture.hasPenalties ? (
        <div
          style={{
            padding: '7px 16px',
            borderRadius: 999,
            border: `1px solid ${accentColor}`,
            color: '#c0ccd8',
            fontSize: 25,
            fontWeight: 700,
          }}
        >
          PEN ({fixture.homePenaltyScore ?? '-'}) - ({fixture.awayPenaltyScore ?? '-'})
        </div>
      ) : null}
    </div>
    <Team team={fixture.awayTeam} badge={fixture.awayBadge} align="right" faded={fixture.awayEliminated} />
  </div>
);

const Team = ({
  team,
  badge,
  align,
  faded,
}: {
  team: string;
  badge: TeamBadge;
  align: 'left' | 'right';
  faded?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      gap: 14,
      opacity: faded ? 0.38 : 1,
      filter: faded ? 'grayscale(1)' : undefined,
      minWidth: 0,
      textAlign: align,
    }}
  >
    <Badge badge={badge} size={70} />
    <div
      style={{
        fontSize: 30,
        lineHeight: 0.96,
        fontWeight: 800,
        textTransform: 'uppercase',
      }}
    >
      {team}
    </div>
  </div>
);

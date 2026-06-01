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
  TeamBadge,
  TierlistGroup,
} from '../lib/types';

type FootballTierlistCompositionProps = {
  channelProfile?: FootballChannelProfile;
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  topScorerPrediction?: string;
  bestPlayerPrediction?: string;
  tiers: TierlistGroup[];
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

export const FootballTierlistComposition = ({
  channelProfile = 'pt',
  leagueName,
  titleLabel,
  subtitleLabel,
  topScorerPrediction,
  bestPlayerPrediction,
  tiers,
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
}: FootballTierlistCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mainStartFrame = Math.round(fps * 1.45);
  const contentFrame = Math.max(0, frame - mainStartFrame);
  const mainOpacity = interpolate(frame, [mainStartFrame, mainStartFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isEnglish = channelProfile === 'en';
  const accentColor = leagueConfig?.accentColor ?? (isEnglish ? '#0A84FF' : '#F0A500');
  const secondaryAccentColor = leagueConfig?.secondaryAccentColor ?? (isEnglish ? '#C8A84B' : '#009B3A');
  const headerAnim = headerEntranceStyle(contentFrame, fps, 0);
  const titleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES);
  const subtitleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES * 2);
  const footerAnim = fadeInStyle(contentFrame, fps, 124);
  const hasManualPredictions =
    Boolean(topScorerPrediction?.trim()) || Boolean(bestPlayerPrediction?.trim());

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#f0f4f8',
        fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
        background:
          'radial-gradient(circle at 86% 12%, rgba(0,155,58,0.16), transparent 28%), radial-gradient(circle at 12% 88%, rgba(0,39,118,0.18), transparent 26%), linear-gradient(180deg, #0b0d12 0%, #07090d 100%)',
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
        secondaryAccentColor={secondaryAccentColor}
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
          secondaryAccentColor={secondaryAccentColor}
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
            padding: '54px 106px 116px 76px',
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
                fontSize: 88,
                lineHeight: 0.86,
                fontWeight: 950,
                letterSpacing: -2.2,
                textTransform: 'uppercase',
              }}
            >
              {titleLabel}
            </div>
            <div
              style={{
                ...subtitleAnim,
                color: isEnglish ? '#4a6070' : '#3a5060',
                fontSize: 34,
                lineHeight: 1,
                fontWeight: 900,
                textTransform: 'uppercase',
              }}
            >
              {subtitleLabel}
            </div>
          </header>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {tiers.map((tier, index) => (
              <TierRow
                key={tier.key}
                tier={tier}
                rowIndex={index}
                timelineFrame={contentFrame}
                isChampion={tier.key === 'champion'}
              />
            ))}
          </div>

          {hasManualPredictions ? (
            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                ...fadeInStyle(contentFrame, fps, 96),
              }}
            >
              <ManualPredictionCard
                label={isEnglish ? 'Top Scorer' : 'Artilheiro'}
                value={topScorerPrediction}
                accentColor={accentColor}
              />
              <ManualPredictionCard
                label={isEnglish ? 'Best Player' : 'Melhor Jogador'}
                value={bestPlayerPrediction}
                accentColor={secondaryAccentColor}
              />
            </div>
          ) : null}

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
                  maxWidth: 620,
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

const TierRow = ({
  tier,
  rowIndex,
  timelineFrame,
  isChampion,
}: {
  tier: TierlistGroup;
  rowIndex: number;
  timelineFrame: number;
  isChampion: boolean;
}) => {
  const opacity = interpolate(
    timelineFrame,
    [rowStartFrame(rowIndex), rowStartFrame(rowIndex) + 12],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const translateY = interpolate(
    timelineFrame,
    [rowStartFrame(rowIndex), rowStartFrame(rowIndex) + 12],
    [28, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'grid',
        gridTemplateColumns: isChampion ? '214px 1fr' : '188px 1fr',
        minHeight: isChampion ? 166 : 116,
        borderRadius: 22,
        overflow: 'hidden',
        border: `2px solid ${tier.accentColor}66`,
        background: '#0f1318',
        boxShadow: isChampion ? `0 0 28px ${tier.accentColor}24` : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 16px',
          background: `linear-gradient(180deg, ${tier.accentColor}33, ${tier.accentColor}12)`,
          borderRight: `2px solid ${tier.accentColor}55`,
          color: tier.accentColor,
          fontSize: isChampion ? 34 : 25,
          lineHeight: 0.92,
          fontWeight: 950,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {tier.label}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isChampion ? '1fr' : `repeat(${Math.min(5, Math.max(1, tier.entries.length))}, 1fr)`,
          gap: isChampion ? 0 : 12,
          alignItems: 'center',
          padding: isChampion ? '16px 26px' : '12px 16px',
        }}
      >
        {tier.entries.map((entry, index) => (
          <TierTeam
            key={`${tier.key}-${entry.team}-${index}`}
            team={entry.team}
            badge={entry.badge}
            accentColor={tier.accentColor}
            featured={isChampion}
          />
        ))}
      </div>
    </div>
  );
};

const TierTeam = ({
  team,
  badge,
  accentColor,
  featured,
}: {
  team: string;
  badge: TeamBadge;
  accentColor: string;
  featured: boolean;
}) => {
  const imagePath = badge.imagePath ?? badge.logoPath;
  const imageSrc = imagePath ? staticFile(imagePath.replace(/^\/+/, '')) : null;

  return (
    <div
      style={{
        minWidth: 0,
        display: 'flex',
        flexDirection: featured ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: featured ? 'flex-start' : 'center',
        gap: featured ? 24 : 8,
      }}
    >
      <div
        style={{
          width: featured ? 116 : 62,
          height: featured ? 116 : 62,
          borderRadius: featured ? 28 : 17,
          background: '#141c24',
          border: `2px solid ${accentColor}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageSrc ? (
          <Img
            src={imageSrc}
            style={{
              width: featured ? 88 : 48,
              height: featured ? 88 : 48,
              objectFit: 'contain',
            }}
          />
        ) : (
          <span
            style={{
              color: '#f0f4f8',
              fontSize: featured ? 36 : 23,
              fontWeight: 950,
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div
        style={{
          minWidth: 0,
          color: '#f0f4f8',
          fontSize: featured ? 66 : 24,
          lineHeight: featured ? 0.92 : 0.96,
          fontWeight: 950,
          textAlign: featured ? 'left' : 'center',
          textTransform: 'uppercase',
          overflowWrap: 'anywhere',
        }}
      >
        {team}
      </div>
    </div>
  );
};

const ManualPredictionCard = ({
  label,
  value,
  accentColor,
}: {
  label: string;
  value?: string;
  accentColor: string;
}) => {
  if (!value?.trim()) {
    return <div />;
  }

  return (
    <div
      style={{
        minHeight: 96,
        padding: '16px 20px',
        borderRadius: 20,
        background: '#0f1318',
        border: `2px solid ${accentColor}66`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 20,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: '#f0f4f8',
          fontSize: 40,
          lineHeight: 0.96,
          fontWeight: 950,
          textTransform: 'uppercase',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </div>
    </div>
  );
};

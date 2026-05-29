import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {FootballColdOpen} from '../components/FootballColdOpen';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {fadeInStyle, footerStartFrame, headerEntranceStyle, rowStartFrame} from '../lib/animations';
import type {
  FootballChannelProfile,
  FootballColdOpenData,
  FootballLanguageProfile,
  LeagueConfig,
  PlayerOfRoundEntry,
  TeamBadge,
} from '../lib/types';

type FootballPlayerOfRoundCompositionProps = {
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  entries: PlayerOfRoundEntry[];
  channelProfile?: FootballChannelProfile;
  languageProfile?: FootballLanguageProfile;
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

const SAFE_AREA = {
  top: 70,
  left: 74,
  right: 162,
  bottom: 218,
};

const getLogoSrc = (badge: TeamBadge) =>
  badge.logoPath ? staticFile(badge.logoPath.replace(/^\//, '')) : null;

export const FootballPlayerOfRoundComposition = ({
  leagueName,
  titleLabel,
  subtitleLabel,
  entries,
  channelProfile,
  languageProfile,
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
}: FootballPlayerOfRoundCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const isEnglishChannel = channelProfile === 'en' || languageProfile === 'en';
  const accentColor = leagueConfig?.accentColor ?? (isEnglishChannel ? '#0A84FF' : '#F0A500');
  const statColor = isEnglishChannel ? accentColor : '#F4C44E';
  const fontFamily = isEnglishChannel
    ? '"Poppins", "Arial", sans-serif'
    : '"Barlow Condensed", "Arial Narrow", sans-serif';
  const sortedEntries = [...entries]
    .sort((left, right) => {
      if (right.rating !== left.rating) {
        return right.rating - left.rating;
      }

      if (right.goals !== left.goals) {
        return right.goals - left.goals;
      }

      return left.rank - right.rank;
    })
    .slice(0, 10);
  const leader = sortedEntries[0];
  const chasingPack = sortedEntries.slice(1);
  const footerAnim = fadeInStyle(frame, fps, footerStartFrame(sortedEntries.length + 1));

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: '#0b0d12',
        color: '#ffffff',
        fontFamily,
      }}
    >
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <VoiceoverBed voiceoverPath={voiceoverPath} />
      <CompetitionAccentRail
        accentColor={accentColor}
        secondaryAccentColor={leagueConfig?.secondaryAccentColor}
      />
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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 78% 18%, ${accentColor}20, transparent 30%), radial-gradient(circle at 10% 80%, ${accentColor}18, transparent 24%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 7,
          background: accentColor,
          boxShadow: `0 0 26px ${accentColor}88`,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: `${SAFE_AREA.top}px ${SAFE_AREA.right}px ${SAFE_AREA.bottom}px ${SAFE_AREA.left}px`,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '9px 17px 8px',
              borderRadius: 999,
              background: '#111820',
              borderLeft: `8px solid ${accentColor}`,
              color: accentColor,
              fontFamily: '"Barlow", "Arial", sans-serif',
              fontSize: 20,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: 2.2,
              textTransform: 'uppercase',
              ...headerEntranceStyle(frame, fps, 0),
            }}
          >
            {leagueName}
          </div>

          <div
            style={{
              fontSize: isEnglishChannel ? 82 : 88,
              lineHeight: 0.9,
              fontWeight: 950,
              letterSpacing: -2.4,
              textTransform: 'uppercase',
              color: accentColor,
              ...headerEntranceStyle(frame, fps, 4),
            }}
          >
            {titleLabel}
          </div>
          <div
            style={{
              color: '#3a5060',
              fontSize: 40,
              lineHeight: 1,
              fontWeight: 800,
              textTransform: 'uppercase',
              ...headerEntranceStyle(frame, fps, 8),
            }}
          >
            {subtitleLabel}
          </div>
        </div>

        {leader ? (
          <LeaderCard
            entry={leader}
            accentColor={accentColor}
            statColor={statColor}
            isEnglishChannel={isEnglishChannel}
            frame={frame}
            fps={fps}
          />
        ) : null}

        <div style={{display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16}}>
          {chasingPack.map((entry, index) => (
            <PlayerRow
              key={`${entry.rank}-${entry.playerName}-${entry.team}`}
              entry={entry}
              accentColor={accentColor}
              statColor={statColor}
              isEnglishChannel={isEnglishChannel}
              frame={frame}
              fps={fps}
              rowIndex={index}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...footerAnim,
          }}
        >
          {ctaText ? (
            <div
              style={{
                padding: '13px 18px 12px',
                borderRadius: 12,
                border: `2px solid ${accentColor}`,
                color: '#ffffff',
                fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
                background: '#0f1318',
                boxShadow: `0 0 18px ${accentColor}33`,
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
    </AbsoluteFill>
  );
};

const LeaderCard = ({
  entry,
  accentColor,
  statColor,
  isEnglishChannel,
  frame,
  fps,
}: {
  entry: PlayerOfRoundEntry;
  accentColor: string;
  statColor: string;
  isEnglishChannel: boolean;
  frame: number;
  fps: number;
}) => {
  const logoSrc = getLogoSrc(entry.badge);
  const pop = interpolate(frame, [12, 22], [0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '132px 1fr 178px',
        alignItems: 'center',
        gap: 22,
        minHeight: 270,
        marginTop: 30,
        padding: '24px 28px',
        borderRadius: 28,
        border: `3px solid ${accentColor}`,
        background: isEnglishChannel
          ? `linear-gradient(90deg, ${accentColor}22, rgba(15,19,24,0.98) 44%, rgba(10,24,40,0.82))`
          : `linear-gradient(90deg, ${accentColor}30, rgba(15,19,24,0.96) 44%, rgba(15,19,24,0.88))`,
        boxShadow: `0 0 42px ${accentColor}44`,
        transform: `scale(${pop})`,
        ...headerEntranceStyle(frame, fps, 12),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 20,
          top: -28,
          fontSize: 140,
          lineHeight: 1,
          fontWeight: 950,
          color: `${accentColor}33`,
        }}
      >
        1
      </div>
      <Badge badge={entry.badge} logoSrc={logoSrc} size={116} accentColor={accentColor} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0}}>
        <div
          style={{
            fontSize: isEnglishChannel ? 56 : 62,
            lineHeight: 0.92,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: isEnglishChannel ? -1.4 : 0,
          }}
        >
          {entry.playerName}
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            padding: '9px 15px 8px',
            borderRadius: 999,
            background: '#0b0d12',
            color: accentColor,
            fontFamily: '"Barlow", "Arial", sans-serif',
            fontSize: 19,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {entry.position ? `${entry.position} · ${entry.team}` : entry.team}
        </div>
        <StatChips
          entry={entry}
          accentColor={accentColor}
          isEnglishChannel={isEnglishChannel}
        />
      </div>
      <RatingBlock rating={entry.rating} statColor={statColor} size="hero" />
    </div>
  );
};

const PlayerRow = ({
  entry,
  accentColor,
  statColor,
  isEnglishChannel,
  frame,
  fps,
  rowIndex,
}: {
  entry: PlayerOfRoundEntry;
  accentColor: string;
  statColor: string;
  isEnglishChannel: boolean;
  frame: number;
  fps: number;
  rowIndex: number;
}) => {
  const logoSrc = getLogoSrc(entry.badge);

  return (
    <div
      style={{
        height: 116,
        display: 'grid',
        gridTemplateColumns: '58px 70px 1fr 112px',
        alignItems: 'center',
        gap: 15,
        padding: '0 18px',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.07)',
        background:
          isEnglishChannel
            ? rowIndex % 2 === 0
              ? 'linear-gradient(90deg, #141c24, #0f1318)'
              : 'linear-gradient(90deg, #0f1720, #0d1118)'
            : rowIndex % 2 === 0
              ? 'linear-gradient(90deg, #141c24, #0f1318)'
              : 'linear-gradient(90deg, #101820, #0d1118)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.035)',
        ...fadeInStyle(frame, fps, rowStartFrame(rowIndex + 3)),
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background: '#0b0d12',
          color: '#e5edf5',
          fontSize: 32,
          fontWeight: 950,
          borderLeft: `5px solid ${accentColor}`,
        }}
      >
        {entry.rank}
      </div>
      <Badge badge={entry.badge} logoSrc={logoSrc} size={62} accentColor={accentColor} />
      <div style={{minWidth: 0}}>
        <div
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            fontSize: 36,
            lineHeight: 0.94,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: isEnglishChannel ? -0.5 : 0,
          }}
        >
          {entry.playerName}
        </div>
        <div
          style={{
            marginTop: 5,
            color: '#6f8393',
            fontFamily: '"Barlow", "Arial", sans-serif',
            fontSize: 16,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {entry.position ? `${entry.position} · ${entry.team}` : entry.team}
        </div>
        <CompactStats entry={entry} isEnglishChannel={isEnglishChannel} />
      </div>
      <RatingBlock rating={entry.rating} statColor={statColor} size="row" />
    </div>
  );
};

const RatingBlock = ({
  rating,
  statColor,
  size,
}: {
  rating: number;
  statColor: string;
  size: 'hero' | 'row';
}) => (
  <div
    style={{
      justifySelf: 'end',
      minWidth: size === 'hero' ? 150 : 96,
      padding: size === 'hero' ? '14px 14px 12px' : '8px 10px',
      borderRadius: size === 'hero' ? 18 : 12,
      background: '#0b0d12',
      border: `2px solid ${statColor}66`,
      color: statColor,
      textAlign: 'center',
      boxShadow: `0 0 18px ${statColor}22`,
    }}
  >
    <div
      style={{
        fontSize: size === 'hero' ? 72 : 42,
        lineHeight: 0.92,
        fontWeight: 950,
      }}
    >
      {rating.toFixed(1)}
    </div>
    <div
      style={{
        marginTop: 4,
        color: '#f0f4f8',
        fontFamily: '"Barlow", "Arial", sans-serif',
        fontSize: size === 'hero' ? 18 : 13,
        fontWeight: 900,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
      }}
    >
      rating
    </div>
  </div>
);

const CompactStats = ({
  entry,
  isEnglishChannel,
}: {
  entry: PlayerOfRoundEntry;
  isEnglishChannel: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      gap: 8,
      marginTop: 7,
      color: '#c0ccd8',
      fontFamily: '"Barlow", "Arial", sans-serif',
      fontSize: 14,
      lineHeight: 1,
      fontWeight: 900,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    <span>{isEnglishChannel ? `G ${entry.goals}` : `Gols ${entry.goals}`}</span>
    <span>{isEnglishChannel ? `A ${entry.assists}` : `Ass. ${entry.assists}`}</span>
    <span>{isEnglishChannel ? `SOT ${entry.shotsOn}` : `CG ${entry.shotsOn}`}</span>
    <span>{isEnglishChannel ? `KP ${entry.keyPasses}` : `PC ${entry.keyPasses}`}</span>
    <span>{entry.minutes} min</span>
  </div>
);

const StatChips = ({
  entry,
  accentColor,
  isEnglishChannel,
}: {
  entry: PlayerOfRoundEntry;
  accentColor: string;
  isEnglishChannel: boolean;
}) => (
  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
    {[
      isEnglishChannel ? `Goals ${entry.goals}` : `Gols ${entry.goals}`,
      isEnglishChannel ? `Ast ${entry.assists}` : `Assist. ${entry.assists}`,
      isEnglishChannel ? `SOT ${entry.shotsOn}` : `Chutes gol ${entry.shotsOn}`,
      isEnglishChannel ? `Key passes ${entry.keyPasses}` : `Passes-chave ${entry.keyPasses}`,
      `${entry.minutes} min`,
    ].map((label) => (
      <div
        key={label}
        style={{
          padding: '7px 9px 6px',
          borderRadius: 8,
          background: '#141c24',
          color: '#f0f4f8',
          border: `1px solid ${accentColor}44`,
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: 15,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: 0.6,
        }}
      >
        {label}
      </div>
    ))}
  </div>
);

const Badge = ({
  badge,
  logoSrc,
  size,
  accentColor,
}: {
  badge: TeamBadge;
  logoSrc: string | null;
  size: number;
  accentColor: string;
}) => (
  <div
    style={{
      width: size,
      height: size,
      display: 'grid',
      placeItems: 'center',
      borderRadius: size * 0.22,
      background: '#f0f4f8',
      boxShadow: `0 0 18px ${accentColor}22`,
      overflow: 'hidden',
    }}
  >
    {logoSrc ? (
      <Img
        src={logoSrc}
        style={{
          width: size * 0.86,
          height: size * 0.86,
          objectFit: 'contain',
        }}
      />
    ) : (
      <span
        style={{
          color: '#0b0d12',
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: Math.max(18, size * 0.28),
          fontWeight: 950,
          letterSpacing: 0.5,
        }}
      >
        {badge.label}
      </span>
    )}
  </div>
);

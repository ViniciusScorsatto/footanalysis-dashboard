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
  TeamBadge,
  TopScorerEntry,
} from '../lib/types';

type FootballTopScorersCompositionProps = {
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  entries: TopScorerEntry[];
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

export const FootballTopScorersComposition = ({
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
}: FootballTopScorersCompositionProps) => {
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
      if (right.goals !== left.goals) {
        return right.goals - left.goals;
      }

      return left.rank - right.rank;
    })
    .slice(0, 10);
  const leader = sortedEntries[0];
  const chasingPack = sortedEntries.slice(1);
  const footerAnim = fadeInStyle(frame, fps, footerStartFrame(sortedEntries.length + 1));
  const titleAnim = headerEntranceStyle(frame, fps, 4);
  const subtitleAnim = headerEntranceStyle(frame, fps, 8);

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
              fontSize: 94,
              lineHeight: 0.88,
              fontWeight: 950,
              letterSpacing: -2.4,
              textTransform: 'uppercase',
              color: accentColor,
              ...titleAnim,
            }}
          >
            {titleLabel}
          </div>
          <div
            style={{
              color: '#3a5060',
              fontSize: 42,
              lineHeight: 1,
              fontWeight: 800,
              textTransform: 'uppercase',
              ...subtitleAnim,
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

        <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18}}>
          {chasingPack.map((entry, index) => (
            <ScorerRow
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
  entry: TopScorerEntry;
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
        gridTemplateColumns: '140px 1fr 164px',
        alignItems: 'center',
        gap: 24,
        minHeight: 250,
        marginTop: 34,
        padding: '26px 30px',
        borderRadius: 28,
        border: `3px solid ${accentColor}`,
        background:
          isEnglishChannel
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
      <Badge badge={entry.badge} logoSrc={logoSrc} size={120} accentColor={accentColor} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <div
          style={{
            fontSize: 68,
            lineHeight: 0.9,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: isEnglishChannel ? -1.2 : 0,
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
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {entry.teamShort} · {entry.team}
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
        <div
          style={{
            fontSize: 98,
            lineHeight: 0.86,
            fontWeight: 950,
            color: statColor,
          }}
        >
          {entry.goals}
        </div>
        <div
          style={{
            fontFamily: '"Barlow", "Arial", sans-serif',
            color: '#f0f4f8',
            fontSize: 23,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          gols
        </div>
      </div>
    </div>
  );
};

const ScorerRow = ({
  entry,
  accentColor,
  statColor,
  isEnglishChannel,
  frame,
  fps,
  rowIndex,
}: {
  entry: TopScorerEntry;
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
        height: 104,
        display: 'grid',
        gridTemplateColumns: '60px 76px 1fr 104px',
        alignItems: 'center',
        gap: 16,
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
          width: 52,
          height: 52,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background: '#0b0d12',
          color: '#e5edf5',
          fontSize: 34,
          fontWeight: 950,
          borderLeft: `5px solid ${accentColor}`,
        }}
      >
        {entry.rank}
      </div>
      <Badge badge={entry.badge} logoSrc={logoSrc} size={66} accentColor={accentColor} />
      <div style={{minWidth: 0}}>
        <div
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            fontSize: 42,
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
            fontSize: 17,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {entry.teamShort} · {entry.team}
        </div>
      </div>
      <div
        style={{
          justifySelf: 'end',
          minWidth: 88,
          padding: '8px 12px',
          borderRadius: 12,
          background: '#0b0d12',
          border: `2px solid ${accentColor}66`,
          color: statColor,
          textAlign: 'center',
          fontSize: 45,
          lineHeight: 0.92,
          fontWeight: 950,
        }}
      >
        {entry.goals}
      </div>
    </div>
  );
};

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

import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {ReactNode} from 'react';
import type {
  FootballRoundSummaryLongVideoJob,
  RoundSummaryEvent,
  RoundSummaryMatch,
  TeamBadge,
} from '../lib/types';

type FootballRoundSummaryLongCompositionProps = {
  job: FootballRoundSummaryLongVideoJob;
};

const BG = '#0b0d12';
const SURFACE = '#0f1318';
const CARD = '#141c24';
const WHITE = '#f0f4f8';
const SILVER = '#c0ccd8';
const STEEL = '#3a5060';
const GOLD = '#F0A500';
const GREEN = '#8BEA12';
const EN_BLUE = '#0A84FF';
const DEFAULT_INTRO_AUDIO_PATH = '/audio/football/gol-na-pressao.mp3';
const ROUND_SUMMARY_BED_AUDIO_PATH = '/audio/football/touchline-pulse.mp3';
const ROUND_SUMMARY_BED_VOLUME = 0.05;
const ROUND_SUMMARY_BED_FADE_FRAMES = 6;
const ROUND_SUMMARY_VOICEOVER_PLAYBACK_RATE = 1.15;
const ROUND_SUMMARY_BACKGROUND = '/backgrounds/foot-analysis-round-summary-bg.png';
const ROUND_SUMMARY_BACKGROUND_EN = '/backgrounds/foot-analysis-round-summary-bg-en.png';
const MAIN_FRAME = {
  left: 535,
  top: 178,
  width: 1325,
  height: 582,
};

const colorWithAlpha = (color = GREEN, alpha = '33') =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : `${GREEN}${alpha}`;

const accentFor = (badge: TeamBadge) => badge.accentColor ?? GREEN;

const isEnglishJob = (job: {channelProfile?: string; languageProfile?: string}) =>
  job.channelProfile === 'en' || job.languageProfile === 'en';

const channelAccent = (isEnglish: boolean) => (isEnglish ? EN_BLUE : GREEN);

export const FootballRoundSummaryLongComposition = ({
  job,
}: FootballRoundSummaryLongCompositionProps) => {
  const isEnglish = isEnglishJob(job);
  const accent = channelAccent(isEnglish);
  const matchStarts = job.matches.reduce<number[]>((starts, match, index) => {
    const previousStart = starts[index - 1] ?? job.introDurationInFrames;
    const previousDuration =
      index === 0 ? 0 : job.matches[index - 1].durationInFrames + job.transitionDurationInFrames;
    return [...starts, previousStart + previousDuration];
  }, []);
  const summaryStart = job.introDurationInFrames;
  const outroStart = Math.max(0, job.durationInFrames - job.outroDurationInFrames);
  const summaryDuration = Math.max(0, outroStart - summaryStart);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: BG,
        color: WHITE,
        fontFamily: '"Poppins", "Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <BroadcastBackdrop backgroundPath={isEnglish ? ROUND_SUMMARY_BACKGROUND_EN : ROUND_SUMMARY_BACKGROUND} />
      <BroadcastShell
        brandLogoPath={job.brandLogoPath}
        disclaimer={job.disclaimer}
        isEnglish={isEnglish}
        accent={accent}
      />
      <Sequence from={0} durationInFrames={job.introDurationInFrames}>
        <StingAudio
          audioPath={job.soundtrackPath ?? DEFAULT_INTRO_AUDIO_PATH}
          volume={job.soundtrackVolume ?? 0.92}
        />
        <IntroScene job={job} isEnglish={isEnglish} accent={accent} />
      </Sequence>
      <Sequence from={summaryStart} durationInFrames={summaryDuration}>
        <Audio
          src={staticFile(ROUND_SUMMARY_BED_AUDIO_PATH.replace(/^\//, ''))}
          volume={(frame) => roundSummaryBedVolume(frame, summaryDuration)}
          loop
        />
      </Sequence>
      {job.matches.map((match, index) => (
        <Sequence
          key={match.id}
          from={matchStarts[index]}
          durationInFrames={match.durationInFrames + job.transitionDurationInFrames}
        >
          <MatchSummaryScene
            match={match}
            index={index}
            total={job.matches.length}
            leagueName={job.leagueName}
            roundLabel={job.roundLabel}
            isEnglish={isEnglish}
            accent={accent}
          />
          {match.voiceoverPath ? (
            <Audio
              src={staticFile(match.voiceoverPath.replace(/^\//, ''))}
              volume={0.86}
              playbackRate={ROUND_SUMMARY_VOICEOVER_PLAYBACK_RATE}
            />
          ) : null}
        </Sequence>
      ))}
      <Sequence
        from={Math.max(0, job.durationInFrames - job.outroDurationInFrames)}
        durationInFrames={job.outroDurationInFrames}
      >
        <StingAudio
          audioPath={job.soundtrackPath ?? DEFAULT_INTRO_AUDIO_PATH}
          volume={job.soundtrackVolume ?? 0.92}
        />
        <OutroScene job={job} isEnglish={isEnglish} accent={accent} />
      </Sequence>
    </AbsoluteFill>
  );
};

const StingAudio = ({audioPath, volume}: {audioPath?: string; volume: number}) => {
  if (!audioPath) return null;

  return <Audio src={staticFile(audioPath.replace(/^\//, ''))} volume={volume} />;
};

const roundSummaryBedVolume = (frame: number, durationInFrames: number) => {
  const fadeFrames = Math.min(ROUND_SUMMARY_BED_FADE_FRAMES, Math.floor(durationInFrames / 2));
  if (fadeFrames <= 0) {
    return ROUND_SUMMARY_BED_VOLUME;
  }

  const fadeIn = interpolate(frame, [0, fadeFrames], [0, ROUND_SUMMARY_BED_VOLUME], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - fadeFrames), durationInFrames],
    [ROUND_SUMMARY_BED_VOLUME, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return Math.min(fadeIn, fadeOut);
};

const BroadcastBackdrop = ({backgroundPath}: {backgroundPath: string}) => (
  <>
    <Img
      src={staticFile(backgroundPath.replace(/^\//, ''))}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'fill',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 36%, rgba(0,0,0,0.08))',
      }}
    />
  </>
);

const BroadcastShell = ({
  brandLogoPath,
  disclaimer,
  isEnglish,
  accent,
}: {
  brandLogoPath?: string;
  disclaimer: string;
  isEnglish: boolean;
  accent: string;
}) => (
  <>
    <Sidebar brandLogoPath={brandLogoPath} isEnglish={isEnglish} accent={accent} />
    <BottomBar disclaimer={disclaimer} isEnglish={isEnglish} accent={accent} />
  </>
);

const Sidebar = ({
  brandLogoPath,
  isEnglish,
  accent,
}: {
  brandLogoPath?: string;
  isEnglish: boolean;
  accent: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 58,
      top: 118,
      width: 360,
      bottom: 140,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: WHITE,
    }}
  >
    {brandLogoPath ? (
      <Img
        src={staticFile(brandLogoPath.replace(/^\//, ''))}
        style={{width: 260, maxHeight: 236, objectFit: 'contain'}}
      />
    ) : null}
    <div
      style={{
        marginTop: 28,
        color: WHITE,
        fontSize: 18,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0,
      }}
    >
      {isEnglish ? 'Predictions • Analysis • Stats' : 'Palpites • Análises • Estatísticas'}
    </div>
    <div
      style={{
        marginTop: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        color: WHITE,
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: 7,
        textTransform: 'uppercase',
      }}
    >
      <span style={{width: 48, height: 4, background: accent}} />
      <span>
        {isEnglish ? 'Follow' : 'Siga nas'} <span style={{color: accent}}>{isEnglish ? 'us' : 'redes'}</span>
      </span>
      <span style={{width: 48, height: 4, background: accent}} />
    </div>
    <div style={{marginTop: 24, width: 340, display: 'grid', gap: 10}}>
      <SocialRow network="instagram" label={isEnglish ? 'footanalysisen' : 'footanalysispt'} accent={accent} />
      <SocialRow network="tiktok" label={isEnglish ? 'foot.analysis.en' : 'foot.analysis.pt'} accent={accent} />
      <SocialRow network="x" label="@FootAnalysisIO" accent={accent} />
      <SocialRow network="reddit" label={isEnglish ? 'r/FootballAnalysisEN' : 'r/FootAnalysisPT'} accent={accent} />
      <SocialRow network="website" label="footanalysis.io" accent={accent} />
    </div>
  </div>
);

type SocialNetwork = 'instagram' | 'tiktok' | 'x' | 'reddit' | 'website';

const SocialRow = ({network, label, accent}: {network: SocialNetwork; label: string; accent: string}) => (
  <div
    style={{
      height: 40,
      display: 'grid',
      gridTemplateColumns: '54px 1fr',
      alignItems: 'center',
      color: WHITE,
      fontSize: 16,
      fontWeight: 800,
      letterSpacing: 1.4,
      background: 'linear-gradient(90deg, rgba(15,19,24,0.96), rgba(20,28,36,0.72))',
      border: '1px solid rgba(240,244,248,0.15)',
      clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
    }}
  >
    <div
      style={{
        width: 50,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: accent,
        color: BG,
      }}
    >
      <SocialIcon network={network} />
    </div>
    <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{label}</div>
  </div>
);

const SocialIcon = ({network}: {network: SocialNetwork}) => {
  const stroke = BG;
  const common = {width: 25, height: 25, viewBox: '0 0 32 32', fill: 'none'};

  if (network === 'instagram') {
    return (
      <svg {...common}>
        <rect x="7" y="7" width="18" height="18" rx="5" stroke={stroke} strokeWidth="3" />
        <circle cx="16" cy="16" r="4.5" stroke={stroke} strokeWidth="3" />
        <circle cx="22" cy="10" r="1.8" fill={stroke} />
      </svg>
    );
  }

  if (network === 'tiktok') {
    return (
      <svg {...common}>
        <path
          d="M18 6v14.2a5.8 5.8 0 1 1-5.8-5.8"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18 6c1.2 4.1 3.6 6.4 7.2 6.9" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (network === 'x') {
    return (
      <svg {...common}>
        <path d="M8 7l16 18M24 7L8 25" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (network === 'reddit') {
    return (
      <svg {...common}>
        <circle cx="16" cy="18" r="9" stroke={stroke} strokeWidth="3" />
        <circle cx="12.5" cy="17.5" r="1.7" fill={stroke} />
        <circle cx="19.5" cy="17.5" r="1.7" fill={stroke} />
        <path d="M12.5 22c2.2 1.5 4.8 1.5 7 0" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16 9l3-5 5 1.5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="25" cy="15" r="2.4" fill={stroke} />
        <circle cx="7" cy="15" r="2.4" fill={stroke} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="10" stroke={stroke} strokeWidth="3" />
      <path
        d="M6 16h20M16 6c3 3.4 4.5 6.7 4.5 10S19 22.6 16 26M16 6c-3 3.4-4.5 6.7-4.5 10S13 22.6 16 26"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

const BottomBar = ({
  disclaimer,
  isEnglish,
  accent,
}: {
  disclaimer: string;
  isEnglish: boolean;
  accent: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: MAIN_FRAME.left,
      top: 804,
      width: MAIN_FRAME.width,
      height: 160,
      display: 'grid',
      gridTemplateColumns: '360px minmax(0, 1fr) 330px',
      alignItems: 'center',
      gap: 20,
      padding: '0 44px',
      background: 'linear-gradient(180deg, rgba(12,16,20,0.94), rgba(6,8,10,0.98))',
      border: `1px solid ${accent}`,
      borderLeft: `16px solid ${accent}`,
      borderRight: `16px solid ${accent}`,
      boxShadow: `0 0 30px ${accent}55`,
      color: WHITE,
      textAlign: 'center',
      textTransform: 'uppercase',
    }}
  >
    <SubscribeLikeBadge icon="play" title={isEnglish ? 'Subscribe' : 'Inscreva-se'} accent={accent} />
    <div style={{color: accent, fontSize: 16, fontWeight: 900, letterSpacing: 3.2, lineHeight: 1.25}}>
      {disclaimer}
    </div>
    <SubscribeLikeBadge icon="like" title={isEnglish ? 'Leave a Like!' : 'Deixe um Like!'} accent={accent} />
  </div>
);

const SubscribeLikeBadge = ({icon, title, accent}: {icon: 'play' | 'like'; title: string; accent: string}) => (
  <div
    style={{
      height: 86,
      display: 'grid',
      gridTemplateColumns: '74px 1fr',
      alignItems: 'center',
      gap: 16,
      padding: '0 18px',
      background: `linear-gradient(135deg, ${accent}26, rgba(15,19,24,0.96) 48%)`,
      border: `1px solid ${accent}88`,
      boxShadow: `0 0 24px ${accent}22, inset 0 0 0 1px rgba(255,255,255,0.06)`,
      clipPath: 'polygon(0 0, 94% 0, 100% 50%, 94% 100%, 0 100%, 6% 50%)',
    }}
  >
    <div
      style={{
        width: 62,
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: accent,
        color: BG,
        borderRadius: 8,
        boxShadow: `0 0 20px ${accent}66`,
      }}
    >
      {icon === 'play' ? <PlayIcon /> : <LikeIcon />}
    </div>
    <div style={{color: WHITE, fontSize: 21, lineHeight: 1, fontWeight: 900, textAlign: 'left', whiteSpace: 'nowrap'}}>
      {title}
    </div>
  </div>
);

const PlayIcon = () => (
  <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
    <path d="M11 8l14 8-14 8V8z" fill={BG} />
  </svg>
);

const LikeIcon = () => (
  <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
    <path
      d="M11 27H7a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2h4v15zM11 14l5-9c1.7.2 2.8 1.6 2.5 3.2L18 12h6.2c1.8 0 3.1 1.7 2.7 3.4l-2 8.6A4 4 0 0 1 21 27H11V14z"
      fill={BG}
    />
  </svg>
);

const MainFrameContent = ({children}: {children: ReactNode}) => (
  <div
    style={{
      position: 'absolute',
      left: MAIN_FRAME.left,
      top: MAIN_FRAME.top,
      width: MAIN_FRAME.width,
      height: MAIN_FRAME.height,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const FrameHeader = ({eyebrow, title, accent = GREEN}: {eyebrow: string; title: string; accent?: string}) => (
  <div
    style={{
      position: 'absolute',
      left: 56,
      right: 56,
      top: 52,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 26,
      textTransform: 'uppercase',
    }}
  >
    <div>
      <div style={{color: accent, fontSize: 16, fontWeight: 900, letterSpacing: 4}}>
        {eyebrow}
      </div>
      <div style={{marginTop: 4, color: WHITE, fontSize: 26, fontWeight: 900, lineHeight: 1}}>
        {title}
      </div>
    </div>
  </div>
);

const IntroScene = ({
  job,
  isEnglish,
  accent,
}: {
  job: FootballRoundSummaryLongVideoJob;
  isEnglish: boolean;
  accent: string;
}) => {
  const frame = useCurrentFrame();
  const openingLines =
    job.openingLines?.length
      ? job.openingLines
      : [
          isEnglish
            ? 'The matchday is complete, with details beyond the scorelines.'
            : 'A rodada terminou com jogos cheios de detalhes.',
          isEnglish
            ? 'Let us look at the goals, numbers, and moments that explain each match.'
            : 'Vamos olhar os gols, os números e os lances que explicam cada partida.',
        ];
  const opacity = interpolate(frame, [4, 26], [0, 1], {extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [8, 34], [46, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const matches = job.matches.slice(0, 4);

  return (
    <MainFrameContent>
      <FrameHeader eyebrow="Foot Analysis" title={job.leagueName} accent={accent} />
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 176,
          width: 670,
          opacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            width: 650,
            minHeight: 230,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            padding: '30px 34px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(15,19,24,0.98), rgba(8,10,12,0.92))',
            border: `1px solid ${colorWithAlpha(accent, '66')}`,
            borderLeft: `10px solid ${accent}`,
            boxShadow: `0 22px 70px ${colorWithAlpha(accent, '18')}`,
            color: WHITE,
            fontSize: 31,
            fontWeight: 900,
            lineHeight: 1.18,
          }}
        >
          {openingLines.slice(0, 2).map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 64,
          top: 170,
          width: 500,
          display: 'grid',
          gap: 12,
          opacity,
          transform: `translateY(${interpolate(frame, [16, 40], [30, 0], {
            extrapolateRight: 'clamp',
          })}px) rotate(-2deg)`,
        }}
      >
        <div style={{color: accent, fontSize: 18, fontWeight: 900, textTransform: 'uppercase'}}>
          {isEnglish ? 'Matches in this recap' : 'Jogos no resumo'}
        </div>
        {matches.map((match, index) => (
          <ScoreStrip key={match.id} index={index + 1} match={match} />
        ))}
      </div>
    </MainFrameContent>
  );
};

const ScoreStrip = ({
  index,
  match,
  rowHeight = 52,
  compact = false,
}: {
  index: number;
  match: RoundSummaryMatch;
  rowHeight?: number;
  compact?: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: compact ? '24px minmax(0, 1fr) 58px minmax(0, 1fr)' : '34px minmax(0, 1fr) 86px minmax(0, 1fr)',
      alignItems: 'center',
      gap: compact ? 7 : 12,
      height: rowHeight,
      padding: compact ? '6px 9px' : '9px 14px',
      borderRadius: 8,
      background: SURFACE,
      borderLeft: `${compact ? 4 : 6}px solid ${accentFor(match.homeBadge)}`,
      borderRight: `${compact ? 4 : 6}px solid ${accentFor(match.awayBadge)}`,
    }}
  >
    <span style={{color: GREEN, fontSize: compact ? 12 : 18, fontWeight: 900}}>{index}</span>
    <TeamText fontSize={compact ? 13 : 19}>{match.homeTeam}</TeamText>
    <span style={{color: GOLD, fontSize: compact ? 17 : 28, fontWeight: 900, textAlign: 'center'}}>
      {match.homeScore} - {match.awayScore}
    </span>
    <TeamText align="right" fontSize={compact ? 13 : 19}>{match.awayTeam}</TeamText>
  </div>
);

const MatchSummaryScene = ({
  match,
  index,
  total,
  leagueName,
  roundLabel,
  isEnglish,
  accent,
}: {
  match: RoundSummaryMatch;
  index: number;
  total: number;
  leagueName: string;
  roundLabel: string;
  isEnglish: boolean;
  accent: string;
}) => {
  const frame = useCurrentFrame();
  const panelOpacity = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp'});
  const panelY = interpolate(frame, [0, 24], [28, 0], {extrapolateRight: 'clamp'});

  return (
    <MainFrameContent>
      <MatchHeader
        match={match}
        eyebrow={`${leagueName} • ${roundLabel}`}
        title={`${isEnglish ? 'Game' : 'Jogo'} ${index + 1} ${isEnglish ? 'of' : 'de'} ${total}`}
        accent={accent}
      />
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 128,
          opacity: panelOpacity,
          transform: `translateY(${panelY}px)`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '430px minmax(0, 1fr) 380px',
            gap: 18,
          }}
        >
          <EventsPanel match={match} isEnglish={isEnglish} />
          <StatsPanel stats={match.keyStats} homeTeam={match.homeTeam} awayTeam={match.awayTeam} isEnglish={isEnglish} />
          <CardsPanel match={match} isEnglish={isEnglish} />
        </div>
      </div>
    </MainFrameContent>
  );
};

const MatchHeader = ({
  match,
  eyebrow,
  title,
  accent = GREEN,
}: {
  match: RoundSummaryMatch;
  eyebrow: string;
  title: string;
  accent?: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 56,
      right: 56,
      top: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      textTransform: 'uppercase',
    }}
  >
    <div>
      <div style={{color: accent, fontSize: 16, fontWeight: 900, letterSpacing: 4}}>
        {eyebrow}
      </div>
      <div style={{marginTop: 4, color: WHITE, fontSize: 26, fontWeight: 900, lineHeight: 1}}>
        {title}
      </div>
    </div>
    <div
      style={{
        minWidth: 560,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 96px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 14,
        padding: '8px 14px',
        borderRadius: 8,
        background: 'linear-gradient(135deg, rgba(15,19,24,0.96), rgba(8,10,12,0.86))',
        border: '1px solid rgba(240,244,248,0.12)',
      }}
    >
      <HeaderTeam team={match.homeTeam} badge={match.homeBadge} align="left" />
      <div style={{color: GOLD, fontSize: 34, lineHeight: 1, fontWeight: 900, textAlign: 'center'}}>
        {match.homeScore} - {match.awayScore}
      </div>
      <HeaderTeam team={match.awayTeam} badge={match.awayBadge} align="right" />
    </div>
  </div>
);

const HeaderTeam = ({
  team,
  badge,
  align,
}: {
  team: string;
  badge: TeamBadge;
  align: 'left' | 'right';
}) => {
  const logoPath = badge.logoPath ?? badge.imagePath;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: align === 'left' ? 'row' : 'row-reverse',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
        textAlign: align,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: CARD,
          border: `1px solid ${colorWithAlpha(accentFor(badge), '66')}`,
          flex: '0 0 auto',
        }}
      >
        {logoPath ? (
          <Img src={staticFile(logoPath.replace(/^\//, ''))} style={{width: 30, height: 30, objectFit: 'contain'}} />
        ) : (
          <span style={{color: GREEN, fontSize: 14, fontWeight: 900}}>{badge.label}</span>
        )}
      </div>
      <div
        style={{
          overflow: 'hidden',
          color: WHITE,
          fontSize: 19,
          lineHeight: 1,
          fontWeight: 900,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {team}
      </div>
    </div>
  );
};

const isGoalEvent = (event: RoundSummaryEvent) =>
  event.type === 'goal' ||
  event.type === 'penalty' ||
  (event.type === 'var' && /goal|gol/i.test(event.detail));

const isCardEvent = (event: RoundSummaryEvent) => event.type === 'card';

const EventsPanel = ({match, isEnglish}: {match: RoundSummaryMatch; isEnglish: boolean}) => {
  const events = match.events.filter(isGoalEvent);
  const compact = events.length > 6;
  return (
    <Panel title={isEnglish ? 'Goals & goal VAR' : 'Gols e VAR de gol'}>
      <div style={{display: 'grid', gap: compact ? 6 : 9}}>
        {events.map((event, index) => (
          <EventRow
            key={`${event.minute}-${event.player}-${index}`}
            event={event}
            match={match}
            compact={compact}
            isEnglish={isEnglish}
          />
        ))}
        {events.length === 0 ? (
          <EmptyText>{isEnglish ? 'No goals or goal VAR recorded.' : 'Nenhum gol ou VAR de gol registrado.'}</EmptyText>
        ) : null}
      </div>
    </Panel>
  );
};

const CardsPanel = ({match, isEnglish}: {match: RoundSummaryMatch; isEnglish: boolean}) => {
  const cards = match.events.filter(isCardEvent);
  const compact = cards.length > 6;
  return (
    <Panel title={isEnglish ? 'Cards' : 'Cartões'}>
      <div style={{display: 'grid', gap: compact ? 6 : 9}}>
        {cards.map((event, index) => (
          <EventRow
            key={`${event.minute}-${event.player}-${index}`}
            event={event}
            match={match}
            compact={compact}
            isEnglish={isEnglish}
          />
        ))}
        {cards.length === 0 ? <EmptyText>{isEnglish ? 'No cards recorded.' : 'Nenhum cartão registrado.'}</EmptyText> : null}
      </div>
    </Panel>
  );
};

const EventRow = ({
  event,
  match,
  compact = false,
  isEnglish,
}: {
  event: RoundSummaryEvent;
  match: RoundSummaryMatch;
  compact?: boolean;
  isEnglish: boolean;
}) => {
  const eventLabel = getEventLabel(event, isEnglish);
  const showDetail = eventLabel && eventLabel !== event.player;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '48px 31px 31px minmax(0, 1fr)' : '52px 34px 34px minmax(0, 1fr)',
        alignItems: 'center',
        gap: compact ? 8 : 10,
        minHeight: compact ? 32 : 38,
        padding: compact ? '5px 8px' : '7px 10px',
        borderRadius: 8,
        background: CARD,
      }}
    >
      <span style={{color: GREEN, fontSize: compact ? 15 : 17, fontWeight: 900}}>
        {event.minute}
        {event.extraMinute ? `+${event.extraMinute}'` : "'"}
      </span>
      <span
        style={{
          width: compact ? 25 : 28,
          height: compact ? 25 : 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          background: eventIconBackground(event),
          color: event.type === 'card' ? BG : WHITE,
          fontSize: compact ? 10 : 12,
          fontWeight: 900,
        }}
      >
        {eventIcon(event, isEnglish)}
      </span>
      <EventTeamBadge event={event} match={match} compact={compact} />
      <div style={{overflow: 'hidden'}}>
        <div
          style={{
            overflow: 'hidden',
            color: WHITE,
            fontSize: compact ? 15 : 17,
            fontWeight: 900,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {event.player || eventLabel || event.detail}
        </div>
        {event.assist ? (
          <div
            style={{
              overflow: 'hidden',
              color: '#9EC7FF',
              fontSize: compact ? 11 : 13,
              fontWeight: 900,
              textOverflow: 'ellipsis',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {isEnglish ? 'Assist' : 'Assistência'}: {event.assist}
          </div>
        ) : showDetail ? (
          <div
            style={{
              overflow: 'hidden',
              color: STEEL,
              fontSize: compact ? 11 : 13,
              fontWeight: 800,
              textOverflow: 'ellipsis',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {eventLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const EventTeamBadge = ({
  event,
  match,
  compact = false,
}: {
  event: RoundSummaryEvent;
  match: RoundSummaryMatch;
  compact?: boolean;
}) => {
  const badge = event.side === 'home' ? match.homeBadge : match.awayBadge;
  const logoPath = badge.logoPath ?? badge.imagePath;

  return (
    <div
      style={{
        width: compact ? 27 : 30,
        height: compact ? 27 : 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        background: 'rgba(11,13,18,0.86)',
        border: `1px solid ${colorWithAlpha(accentFor(badge), '66')}`,
      }}
    >
      {logoPath ? (
        <Img
          src={staticFile(logoPath.replace(/^\//, ''))}
          style={{
            width: compact ? 20 : 22,
            height: compact ? 20 : 22,
            objectFit: 'contain',
          }}
        />
      ) : (
        <span style={{color: GREEN, fontSize: compact ? 9 : 10, fontWeight: 900}}>
          {badge.label}
        </span>
      )}
    </div>
  );
};

const eventIcon = (event: RoundSummaryEvent, isEnglish: boolean) => {
  if (event.type === 'goal') return isEnglish ? 'GOAL' : 'GOL';
  if (event.type === 'penalty') return 'PEN';
  if (event.type === 'card') return '';
  if (event.type === 'var') return 'VAR';
  if (event.type === 'subst') return 'SUB';
  return '•';
};

const getEventLabel = (event: RoundSummaryEvent, isEnglish: boolean) => {
  const detail = String(event.detail ?? '').trim();
  const lowerDetail = detail.toLowerCase();

  if (event.type === 'goal') {
    if (lowerDetail.includes('own')) return isEnglish ? 'Own goal' : 'Gol contra';
    return '';
  }
  if (event.type === 'penalty') return isEnglish ? 'Penalty' : 'Pênalti';
  if (event.type === 'var') {
    if (lowerDetail.includes('cancel')) return isEnglish ? 'Goal ruled out by VAR' : 'Gol anulado pelo VAR';
    if (lowerDetail.includes('confirm')) return isEnglish ? 'Goal confirmed by VAR' : 'Gol confirmado pelo VAR';
    return isEnglish ? 'Goal VAR' : 'VAR de gol';
  }
  if (event.type === 'card' && /red|vermelho/i.test(detail)) return isEnglish ? 'Red card' : 'Cartão vermelho';
  if (event.type === 'card') return isEnglish ? 'Yellow card' : 'Cartão amarelo';
  if (event.type === 'subst') return isEnglish ? 'Substitution' : 'Substituição';

  if (isEnglish) {
    return detail.replace(/\bnormal goal\b/gi, '').trim();
  }

  return detail
    .replace(/\bnormal goal\b/gi, '')
    .replace(/\byellow card\b/gi, 'Cartão amarelo')
    .replace(/\bred card\b/gi, 'Cartão vermelho')
    .replace(/\bgoal\b/gi, 'Gol')
    .trim();
};

const eventIconBackground = (event: RoundSummaryEvent) => {
  if (event.type === 'goal' || event.type === 'penalty') return GREEN;
  if (event.type === 'card' && /red|vermelho/i.test(event.detail)) return '#E74C3C';
  if (event.type === 'card') return '#F0C400';
  if (event.type === 'var') return '#2E86DE';
  return '#263340';
};

const StatsPanel = ({
  stats,
  homeTeam,
  awayTeam,
  isEnglish,
}: {
  stats: RoundSummaryMatch['keyStats'];
  homeTeam: string;
  awayTeam: string;
  isEnglish: boolean;
}) => (
  <Panel title={isEnglish ? 'Stats' : 'Estatísticas'}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '64px minmax(190px, 1fr) 64px',
        gap: 8,
        color: STEEL,
        fontSize: 12,
        fontWeight: 900,
        textTransform: 'uppercase',
      }}
    >
      <span>{teamShort(homeTeam)}</span>
      <span />
      <span style={{textAlign: 'right'}}>{teamShort(awayTeam)}</span>
    </div>
    <div style={{display: 'grid', gap: 8, marginTop: 10}}>
      {stats.slice(0, 7).map((stat) => (
        <StatRow key={stat.label} stat={stat} />
      ))}
    </div>
  </Panel>
);

const StatRow = ({stat}: {stat: RoundSummaryMatch['keyStats'][number]}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '64px minmax(190px, 1fr) 64px',
      alignItems: 'center',
      gap: 8,
      minHeight: 34,
      color: WHITE,
    }}
  >
    <span style={{color: GREEN, fontSize: 18, fontWeight: 900}}>{stat.homeValue}</span>
    <span
      style={{
        color: SILVER,
        fontSize: /cartões/i.test(stat.label) ? 13 : 15,
        fontWeight: 900,
        textAlign: 'center',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {stat.label}
    </span>
    <span style={{color: GREEN, fontSize: 18, fontWeight: 900, textAlign: 'right'}}>{stat.awayValue}</span>
  </div>
);

const Panel = ({title, children}: {title: string; children: ReactNode}) => (
  <div
    style={{
      minHeight: 300,
      padding: 16,
      borderRadius: 8,
      background: 'rgba(15,19,24,0.86)',
      border: '1px solid rgba(240,244,248,0.12)',
    }}
  >
    <div style={{color: GREEN, fontSize: 17, fontWeight: 900, textTransform: 'uppercase'}}>
      {title}
    </div>
    <div style={{marginTop: 12}}>{children}</div>
  </div>
);

const EmptyText = ({children}: {children: ReactNode}) => (
  <div style={{color: STEEL, fontSize: 15, fontWeight: 800}}>{children}</div>
);

const TeamText = ({
  children,
  align = 'left',
  fontSize = 19,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  fontSize?: number;
}) => (
  <span
    style={{
      overflow: 'hidden',
      color: WHITE,
      fontSize,
      fontWeight: 900,
      textAlign: align,
      textOverflow: 'ellipsis',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const teamShort = (team: string) =>
  String(team)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const OutroScene = ({
  job,
  isEnglish,
  accent,
}: {
  job: FootballRoundSummaryLongVideoJob;
  isEnglish: boolean;
  accent: string;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
  const matchCount = job.matches.length;
  const columns = matchCount <= 7 ? 1 : matchCount <= 16 ? 2 : 3;
  const rows = Math.ceil(matchCount / columns);
  const gap = rows > 8 ? 6 : 8;
  const availableHeight = 430;
  const rowHeight = Math.max(32, Math.min(52, Math.floor((availableHeight - gap * (rows - 1)) / rows)));
  const compact = columns > 1 || rowHeight < 46;

  return (
    <MainFrameContent>
      <FrameHeader eyebrow={isEnglish ? 'All results' : 'Todos os resultados'} title={job.roundLabel} accent={accent} />
      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 140,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap,
          opacity,
        }}
      >
        {job.matches.map((match, index) => (
          <ScoreStrip
            key={match.id}
            index={index + 1}
            match={match}
            rowHeight={rowHeight}
            compact={compact}
          />
        ))}
      </div>
    </MainFrameContent>
  );
};

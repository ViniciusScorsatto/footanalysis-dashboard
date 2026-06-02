import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {ReactNode} from 'react';
import type {FootballPredictionsLongVideoJob, LongformPredictionMatch, TeamBadge} from '../lib/types';

type FootballPredictionsLongCompositionProps = {
  job: FootballPredictionsLongVideoJob;
};

const GOLD = '#F0A500';
const BG = '#0b0d12';
const SURFACE = '#0f1318';
const CARD = '#141c24';
const BORDER = '#1e2a3a';
const WHITE = '#f0f4f8';
const SILVER = '#c0ccd8';
const STEEL = '#3a5060';
const DEFAULT_INTRO_AUDIO_PATH = '/audio/football/gol-na-pressao.mp3';
const PREDICTION_BED_AUDIO_PATH = '/audio/football/touchline-pulse.mp3';
const PREDICTION_BED_VOLUME = 0.05;
const PREDICTION_BED_FADE_FRAMES = 6;
const LONGFORM_SHELL_BACKGROUND = '/backgrounds/foot-analysis-long-shell-bg.png';
const GREEN = '#8BEA12';
const MAIN_FRAME = {
  left: 535,
  top: 178,
  width: 1325,
  height: 582,
};

const colorWithAlpha = (color = GOLD, alpha = '33') =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : `${GOLD}${alpha}`;

const accentFor = (badge: TeamBadge) => badge.accentColor ?? GOLD;

const toPortugueseRoundLabel = (value?: string) => {
  const label = String(value ?? '').trim();
  const regularSeasonMatch = label.match(/^regular season\s*-\s*(\d+)$/i);
  if (regularSeasonMatch) {
    return `Rodada ${regularSeasonMatch[1]}`;
  }

  return label.replace(/\bregular season\b/gi, 'Temporada regular');
};

export const FootballPredictionsLongComposition = ({job}: FootballPredictionsLongCompositionProps) => {
  const matchStarts = job.matches.reduce<number[]>((starts, match, index) => {
    const previousStart = starts[index - 1] ?? job.introDurationInFrames;
    const previousDuration =
      index === 0 ? 0 : job.matches[index - 1].durationInFrames + job.transitionDurationInFrames;
    return [...starts, previousStart + previousDuration];
  }, []);
  const predictionsStart = job.introDurationInFrames;
  const outroStart = Math.max(0, job.durationInFrames - job.outroDurationInFrames);
  const predictionsDuration = Math.max(0, outroStart - predictionsStart);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: BG,
        color: WHITE,
        fontFamily: '"Poppins", "Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <BroadcastBackdrop />
      <BroadcastShell brandLogoPath={job.brandLogoPath} />
      <Sequence from={0} durationInFrames={job.introDurationInFrames}>
        <StingAudio
          audioPath={job.soundtrackPath ?? DEFAULT_INTRO_AUDIO_PATH}
          volume={job.soundtrackVolume ?? 0.92}
        />
        <IntroScene job={job} />
      </Sequence>
      <Sequence from={predictionsStart} durationInFrames={predictionsDuration}>
        <Audio
          src={staticFile(PREDICTION_BED_AUDIO_PATH.replace(/^\//, ''))}
          volume={(frame) => predictionBedVolume(frame, predictionsDuration)}
          loop
        />
      </Sequence>
      {job.matches.map((match, index) => (
        <Sequence
          key={match.id}
          from={matchStarts[index]}
          durationInFrames={match.durationInFrames + job.transitionDurationInFrames}
        >
          <MatchScene
            match={match}
            index={index}
            total={job.matches.length}
            leagueName={job.leagueName}
            roundLabel={toPortugueseRoundLabel(job.roundLabel)}
          />
          {match.voiceoverPath ? (
            <Audio src={staticFile(match.voiceoverPath.replace(/^\//, ''))} volume={0.86} />
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
        <OutroScene job={job} />
      </Sequence>
    </AbsoluteFill>
  );
};

const StingAudio = ({audioPath, volume}: {audioPath?: string; volume: number}) => {
  if (!audioPath) {
    return null;
  }

  return <Audio src={staticFile(audioPath.replace(/^\//, ''))} volume={volume} />;
};

const predictionBedVolume = (frame: number, durationInFrames: number) => {
  const fadeFrames = Math.min(PREDICTION_BED_FADE_FRAMES, Math.floor(durationInFrames / 2));
  if (fadeFrames <= 0) {
    return PREDICTION_BED_VOLUME;
  }

  const fadeIn = interpolate(frame, [0, fadeFrames], [0, PREDICTION_BED_VOLUME], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationInFrames - fadeFrames), durationInFrames],
    [PREDICTION_BED_VOLUME, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return Math.min(fadeIn, fadeOut);
};

const BroadcastBackdrop = () => (
  <>
    <Img
      src={staticFile(LONGFORM_SHELL_BACKGROUND.replace(/^\//, ''))}
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
          'linear-gradient(90deg, rgba(0,0,0,0.14), rgba(0,0,0,0.02) 36%, rgba(0,0,0,0.08))',
      }}
    />
  </>
);

const BroadcastShell = ({brandLogoPath}: {brandLogoPath?: string}) => (
  <>
    <Sidebar brandLogoPath={brandLogoPath} />
    <SponsorBar />
  </>
);

const Sidebar = ({brandLogoPath}: {brandLogoPath?: string}) => (
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
      Palpites • Análises • Estatísticas
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
      <span style={{width: 48, height: 4, background: GREEN}} />
      <span>Siga nas <span style={{color: GREEN}}>redes</span></span>
      <span style={{width: 48, height: 4, background: GREEN}} />
    </div>
    <div style={{marginTop: 24, width: 340, display: 'grid', gap: 10}}>
      <SocialRow network="instagram" label="footanalysispt" />
      <SocialRow network="tiktok" label="foot.analysis.pt" />
      <SocialRow network="x" label="@FootAnalysisIO" />
      <SocialRow network="reddit" label="r/FootAnalysisPT" />
      <SocialRow network="website" label="footanalysis.io" />
    </div>
  </div>
);

type SocialNetwork = 'instagram' | 'tiktok' | 'x' | 'reddit' | 'website';

const SocialRow = ({network, label}: {network: SocialNetwork; label: string}) => (
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
        background: GREEN,
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
  const common = {
    width: 25,
    height: 25,
    viewBox: '0 0 32 32',
    fill: 'none',
  };

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
        <path
          d="M18 6c1.2 4.1 3.6 6.4 7.2 6.9"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
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
      <path d="M6 16h20M16 6c3 3.4 4.5 6.7 4.5 10S19 22.6 16 26M16 6c-3 3.4-4.5 6.7-4.5 10S13 22.6 16 26" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
};

const SponsorBar = () => (
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
      border: `1px solid ${GREEN}`,
      borderLeft: `16px solid ${GREEN}`,
      borderRight: `16px solid ${GREEN}`,
      boxShadow: `0 0 30px ${GREEN}55`,
      color: WHITE,
      textAlign: 'center',
      textTransform: 'uppercase',
    }}
  >
    <SubscribeLikeBadge icon="play" title="Inscreva-se" />
    <div style={{color: GREEN, fontSize: 16, fontWeight: 900, letterSpacing: 3.2, lineHeight: 1.25}}>
      Os palpites têm caráter exclusivamente recreativo.
    </div>
    <SubscribeLikeBadge icon="like" title="Deixe um Like!" />
  </div>
);

const SubscribeLikeBadge = ({icon, title}: {icon: 'play' | 'like'; title: string}) => (
  <div
    style={{
      height: 86,
      display: 'grid',
      gridTemplateColumns: '74px 1fr',
      alignItems: 'center',
      gap: 16,
      padding: '0 18px',
      background: `linear-gradient(135deg, ${GREEN}26, rgba(15,19,24,0.96) 48%)`,
      border: `1px solid ${GREEN}88`,
      boxShadow: `0 0 24px ${GREEN}22, inset 0 0 0 1px rgba(255,255,255,0.06)`,
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
        background: GREEN,
        color: BG,
        borderRadius: 8,
        boxShadow: `0 0 20px ${GREEN}66`,
      }}
    >
      {icon === 'play' ? <PlayIcon /> : <LikeIcon />}
    </div>
    <div
      style={{
        color: WHITE,
        fontSize: 21,
        lineHeight: 1,
        fontWeight: 900,
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
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

const IntroScene = ({job}: {job: FootballPredictionsLongVideoJob}) => {
  const frame = useCurrentFrame();
  const openingLines =
    job.openingLines?.length
      ? job.openingLines
      : [
          'Hoje tem rodada cheia e eu separei os jogos que podem mexer na tabela.',
          'Agora vamos para os palpites, jogo por jogo, com o placar que eu apostaria.',
        ];
  const titleY = interpolate(frame, [8, 34], [46, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [4, 26], [0, 1], {extrapolateRight: 'clamp'});
  const hookScale = interpolate(frame, [18, 44], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const matches = job.matches.slice(0, 4);
  const topTeams = job.matches
    .flatMap((match) => [match.homeTeam, match.awayTeam])
    .slice(0, 4);

  return (
    <MainFrameContent>
      <FrameHeader eyebrow="Foot Analysis" title={job.leagueName} />
      <FlyingInsightCard
        title="Tabela"
        kicker="Classificação"
        delay={12}
        fromX={700}
        fromY={-60}
        toX={825}
        toY={128}
        rotation={-3}
        accent={GOLD}
      >
        {topTeams.map((team, index) => (
          <MiniTableRow
            key={`${team}-${index}`}
            rank={index + 1}
            label={team}
            value={`${22 - index * 3} pts`}
            accent={index === 0 ? GOLD : index === 1 ? '#27AE60' : SILVER}
          />
        ))}
      </FlyingInsightCard>
      <FlyingInsightCard
        title="Últimos jogos"
        kicker="Forma recente"
        delay={28}
        fromX={840}
        fromY={360}
        toX={820}
        toY={318}
        rotation={4}
        accent="#27AE60"
      >
        {matches.slice(0, 3).map((match) => (
          <MiniMatchRow
            key={`recent-${match.id}`}
            left={match.homeTeam}
            center={`${match.homeScore} - ${match.awayScore}`}
            right={match.awayTeam}
          />
        ))}
      </FlyingInsightCard>
      <FlyingInsightCard
        title="Palpites"
        kicker="Placar provável"
        delay={42}
        fromX={760}
        fromY={740}
        toX={744}
        toY={412}
        rotation={-2}
        accent="#E74C3C"
        wide
      >
        {matches.slice(0, 3).map((match) => (
          <MiniMatchRow
            key={`pick-${match.id}`}
            left={match.homeTeam}
            center={`${match.homeScore} - ${match.awayScore}`}
            right={match.awayTeam}
          />
        ))}
      </FlyingInsightCard>
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 186,
          width: 670,
          opacity,
          transform: `translateY(${titleY}px) scale(${hookScale})`,
          transformOrigin: 'left center',
        }}
      >
        <div
          style={{
            width: 640,
            minHeight: 210,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            padding: '30px 34px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(15,19,24,0.98), rgba(8,10,12,0.92))',
            border: `1px solid ${colorWithAlpha(GREEN, '66')}`,
            borderLeft: `10px solid ${GREEN}`,
            boxShadow: `0 22px 70px ${colorWithAlpha(GREEN, '18')}`,
            color: WHITE,
            fontSize: 31,
            fontWeight: 900,
            lineHeight: 1.18,
          }}
        >
          {openingLines.slice(0, 2).map((line) => (
            <div key={line}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </MainFrameContent>
  );
};

const FlyingInsightCard = ({
  title,
  kicker,
  children,
  delay,
  fromX,
  fromY,
  toX,
  toY,
  rotation,
  accent,
  wide = false,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
  delay: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rotation: number;
  accent: string;
  wide?: boolean;
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = Math.sin((frame + delay) / 18) * 5;
  const x = interpolate(progress, [0, 1], [fromX, toX]);
  const y = interpolate(progress, [0, 1], [fromY, toY]) + drift;
  const opacity = interpolate(progress, [0, 0.28, 1], [0, 1, 1]);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: wide ? 560 : 500,
        padding: 20,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${colorWithAlpha(accent, '22')}, ${SURFACE} 42%)`,
        border: `1px solid ${BORDER}`,
        borderTop: `7px solid ${accent}`,
        boxShadow: `0 26px 76px ${colorWithAlpha(accent, '18')}`,
        opacity,
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
      }}
    >
      <div style={{color: accent, fontSize: 16, fontWeight: 900, textTransform: 'uppercase'}}>
        {kicker}
      </div>
      <div
        style={{
          marginTop: 4,
          marginBottom: 14,
          color: WHITE,
          fontSize: 34,
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <div style={{display: 'grid', gap: 8}}>{children}</div>
    </div>
  );
};

const MiniTableRow = ({
  rank,
  label,
  value,
  accent,
}: {
  rank: number;
  label: string;
  value: string;
  accent: string;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '34px minmax(0, 1fr) 80px',
      alignItems: 'center',
      gap: 10,
      minHeight: 38,
      padding: '8px 10px',
      borderRadius: 8,
      background: CARD,
      color: WHITE,
    }}
  >
    <span style={{color: accent, fontSize: 18, fontWeight: 900}}>{rank}</span>
    <span
      style={{
        overflow: 'hidden',
        fontSize: 20,
        fontWeight: 900,
        textOverflow: 'ellipsis',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    <span style={{color: accent, fontSize: 18, fontWeight: 900, textAlign: 'right'}}>
      {value}
    </span>
  </div>
);

const MiniMatchRow = ({
  left,
  center,
  right,
}: {
  left: string;
  center: string;
  right: string;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 84px minmax(0, 1fr)',
      alignItems: 'center',
      gap: 10,
      minHeight: 40,
      padding: '8px 10px',
      borderRadius: 8,
      background: CARD,
    }}
  >
    <span
      style={{
        overflow: 'hidden',
        color: WHITE,
        fontSize: 19,
        fontWeight: 900,
        textOverflow: 'ellipsis',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {left}
    </span>
    <span style={{color: GOLD, fontSize: 22, fontWeight: 900, textAlign: 'center'}}>
      {center}
    </span>
    <span
      style={{
        overflow: 'hidden',
        color: WHITE,
        fontSize: 19,
        fontWeight: 900,
        textAlign: 'right',
        textOverflow: 'ellipsis',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {right}
    </span>
  </div>
);

const MatchScene = ({
  match,
  index,
  total,
  leagueName,
  roundLabel,
}: {
  match: LongformPredictionMatch;
  index: number;
  total: number;
  leagueName: string;
  roundLabel: string;
}) => {
  const frame = useCurrentFrame();
  const panelIn = interpolate(frame, [0, 24], [28, 0], {extrapolateRight: 'clamp'});
  const panelOpacity = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp'});
  const scoreScale = interpolate(frame, [46, 64, 78], [0.72, 1.14, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scoreOpacity = interpolate(frame, [42, 58], [0, 1], {extrapolateRight: 'clamp'});
  const underlineWidth = interpolate(frame, [68, 96], [0, 100], {extrapolateRight: 'clamp'});
  const homeAccent = accentFor(match.homeBadge);
  const awayAccent = accentFor(match.awayBadge);

  return (
    <MainFrameContent>
      <FrameHeader eyebrow={`${leagueName} · ${roundLabel}`} title={`Jogo ${index + 1} de ${total}`} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: `linear-gradient(180deg, ${homeAccent}, ${colorWithAlpha(homeAccent, '22')})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: `linear-gradient(180deg, ${awayAccent}, ${colorWithAlpha(awayAccent, '22')})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          top: 104,
          bottom: 78,
          display: 'grid',
          gridTemplateColumns: '1fr 280px 1fr',
          alignItems: 'center',
          gap: 26,
          opacity: panelOpacity,
          transform: `translateY(${panelIn}px)`,
        }}
      >
        <TeamPanel team={match.homeTeam} badge={match.homeBadge} align="left" />
        <div
          style={{
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
          }}
        >
          <div
            style={{
              color: STEEL,
              fontSize: 20,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Palpite
          </div>
          <div
            style={{
              width: 264,
              height: 154,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: `linear-gradient(90deg, ${colorWithAlpha(homeAccent, '38')}, #1a1600 46%, #1a1600 54%, ${colorWithAlpha(awayAccent, '38')})`,
              border: `3px solid ${GREEN}`,
              boxShadow: `0 24px 70px ${colorWithAlpha(homeAccent, '18')}, 0 24px 70px ${colorWithAlpha(awayAccent, '18')}`,
              opacity: scoreOpacity,
              transform: `scale(${scoreScale})`,
            }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: 76,
                lineHeight: 1,
                fontWeight: 900,
              }}
            >
              {match.homeScore} - {match.awayScore}
            </span>
          </div>
          <div
            style={{
              width: `${underlineWidth}%`,
              height: 6,
              maxWidth: 260,
              background: `linear-gradient(90deg, ${homeAccent}, ${GREEN}, ${awayAccent})`,
            }}
          />
        </div>
        <TeamPanel team={match.awayTeam} badge={match.awayBadge} align="right" />
      </div>
    </MainFrameContent>
  );
};

const TeamPanel = ({
  team,
  badge,
  align,
}: {
  team: string;
  badge: TeamBadge;
  align: 'left' | 'right';
}) => {
  const accent = accentFor(badge);

  return (
    <div
      style={{
        height: 370,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        justifyContent: 'center',
        gap: 18,
        padding: 28,
        borderRadius: 8,
        background: `linear-gradient(${align === 'left' ? 110 : 250}deg, ${colorWithAlpha(accent, '2d')}, ${SURFACE} 42%)`,
        border: `1px solid ${BORDER}`,
        borderTop: `8px solid ${accent}`,
        boxShadow: `0 22px 70px ${colorWithAlpha(accent, '14')}`,
      }}
    >
      <Badge badge={badge} />
      <div
        style={{
          color: WHITE,
          fontSize: 45,
          lineHeight: 0.94,
          fontWeight: 900,
          textTransform: 'uppercase',
          textAlign: align,
          letterSpacing: 0,
        }}
      >
        {team}
      </div>
    </div>
  );
};

const Badge = ({badge}: {badge: TeamBadge}) => {
  const logoPath = badge.logoPath ?? badge.imagePath;

  return (
    <div
      style={{
        width: 132,
        height: 132,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        background: CARD,
        border: `1px solid ${colorWithAlpha(accentFor(badge), '66')}`,
        boxShadow: `inset 0 0 0 6px ${colorWithAlpha(accentFor(badge), '14')}`,
      }}
    >
      {logoPath ? (
        <Img
          src={staticFile(logoPath.replace(/^\//, ''))}
          style={{width: 96, height: 96, objectFit: 'contain'}}
        />
      ) : (
        <span style={{color: GOLD, fontSize: 42, fontWeight: 900}}>{badge.label}</span>
      )}
    </div>
  );
};

const FrameHeader = ({eyebrow, title}: {eyebrow: string; title: string}) => (
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
      <div style={{color: GREEN, fontSize: 16, fontWeight: 900, letterSpacing: 4}}>
        {eyebrow}
      </div>
      <div style={{marginTop: 4, color: WHITE, fontSize: 26, fontWeight: 900, lineHeight: 1}}>
        {title}
      </div>
    </div>
  </div>
);

const OutroScene = ({job}: {job: FootballPredictionsLongVideoJob}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
  const roundLabel = toPortugueseRoundLabel(job.roundLabel);
  const columnCount = job.matches.length > 14 ? 3 : job.matches.length > 7 ? 2 : 1;
  const rowFontSize = job.matches.length > 14 ? 18 : job.matches.length > 7 ? 21 : 25;
  const scoreFontSize = job.matches.length > 14 ? 26 : job.matches.length > 7 ? 30 : 34;

  return (
    <MainFrameContent>
      <FrameHeader eyebrow="Todos os palpites" title={roundLabel} />
      <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        opacity,
        textAlign: 'center',
        padding: '96px 54px 44px',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: 12,
          marginTop: 10,
        }}
      >
        {job.matches.map((match, index) => {
          const homeAccent = accentFor(match.homeBadge);
          const awayAccent = accentFor(match.awayBadge);
          return (
            <div
              key={match.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px minmax(0, 1fr) 90px minmax(0, 1fr)',
                alignItems: 'center',
                gap: 12,
                minHeight: job.matches.length > 14 ? 42 : 50,
                padding: '8px 12px',
                borderRadius: 8,
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderLeft: `6px solid ${homeAccent}`,
                borderRight: `6px solid ${awayAccent}`,
              }}
            >
              <span style={{color: GOLD, fontSize: 20, fontWeight: 900}}>
                {index + 1}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  color: WHITE,
                  fontSize: rowFontSize,
                  fontWeight: 900,
                  textAlign: 'left',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {match.homeTeam}
              </span>
              <span
                style={{
                  color: GOLD,
                  fontSize: scoreFontSize,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {match.homeScore} - {match.awayScore}
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  color: WHITE,
                  fontSize: rowFontSize,
                  fontWeight: 900,
                  textAlign: 'right',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {match.awayTeam}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{color: SILVER, fontSize: 20, lineHeight: 1.35, fontWeight: 600}}>
        {job.disclaimer}
      </div>
      </div>
    </MainFrameContent>
  );
};

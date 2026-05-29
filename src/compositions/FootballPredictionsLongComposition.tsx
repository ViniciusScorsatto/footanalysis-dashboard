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

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: BG,
        color: WHITE,
        fontFamily: '"Poppins", "Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <Backdrop />
      <Sequence from={0} durationInFrames={job.introDurationInFrames}>
        <StingAudio
          audioPath={job.soundtrackPath ?? DEFAULT_INTRO_AUDIO_PATH}
          volume={job.soundtrackVolume ?? 0.92}
        />
        <IntroScene job={job} />
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
            brandLogoPath={job.brandLogoPath}
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

const Backdrop = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(135deg, rgba(15,19,24,0.98) 0%, rgba(11,13,18,0.96) 56%, rgba(20,28,36,0.98) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.16,
        backgroundImage:
          'linear-gradient(90deg, rgba(240,165,0,0.22) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 10,
        background: GOLD,
      }}
    />
  </>
);

const IntroScene = ({job}: {job: FootballPredictionsLongVideoJob}) => {
  const frame = useCurrentFrame();
  const roundLabel = toPortugueseRoundLabel(job.roundLabel);
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
    <div style={{position: 'absolute', inset: 0, padding: '76px 88px 72px'}}>
      <Header logoPath={job.brandLogoPath} eyebrow="Foot Analysis" />
      <FlyingInsightCard
        title="Tabela"
        kicker="Classificação"
        delay={12}
        fromX={680}
        fromY={-60}
        toX={1140}
        toY={250}
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
        fromX={820}
        fromY={420}
        toX={1120}
        toY={610}
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
        fromX={520}
        fromY={980}
        toX={710}
        toY={720}
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
          left: 88,
          top: 246,
          width: 1020,
          opacity,
          transform: `translateY(${titleY}px) scale(${hookScale})`,
          transformOrigin: 'left center',
        }}
      >
        <div style={{color: GOLD, fontSize: 28, fontWeight: 800, textTransform: 'uppercase'}}>
          {job.leagueName}
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 1080,
            color: WHITE,
            fontSize: 104,
            lineHeight: 0.96,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 0,
          }}
        >
          Palpites da rodada com dados na tela
        </div>
        <div
          style={{
            marginTop: 28,
            color: SILVER,
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {roundLabel} · tabela · últimos jogos · {job.matches.length} palpites
        </div>
        <div
          style={{
            width: 560,
            marginTop: 32,
            padding: '18px 22px',
            borderRadius: 8,
            background: SURFACE,
            border: `1px solid ${colorWithAlpha(GOLD, '66')}`,
            borderLeft: `8px solid ${GOLD}`,
            color: WHITE,
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.18,
          }}
        >
          {openingLines.slice(0, 2).map((line) => (
            <div key={line} style={{marginBottom: 8}}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
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
        width: wide ? 680 : 500,
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
  brandLogoPath,
}: {
  match: LongformPredictionMatch;
  index: number;
  total: number;
  leagueName: string;
  roundLabel: string;
  brandLogoPath?: string;
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
    <div style={{position: 'absolute', inset: 0, padding: '58px 80px 54px'}}>
      <Header logoPath={brandLogoPath} eyebrow={`${leagueName} · ${roundLabel}`} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 0,
          width: 18,
          background: `linear-gradient(180deg, ${homeAccent}, ${colorWithAlpha(homeAccent, '22')})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 10,
          bottom: 0,
          width: 18,
          background: `linear-gradient(180deg, ${awayAccent}, ${colorWithAlpha(awayAccent, '22')})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 176,
          bottom: 124,
          display: 'grid',
          gridTemplateColumns: '1fr 360px 1fr',
          alignItems: 'center',
          gap: 34,
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
              fontSize: 24,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Palpite
          </div>
          <div
            style={{
              width: 330,
              height: 190,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: `linear-gradient(90deg, ${colorWithAlpha(homeAccent, '38')}, #1a1600 46%, #1a1600 54%, ${colorWithAlpha(awayAccent, '38')})`,
              border: `3px solid ${GOLD}`,
              boxShadow: `0 24px 70px ${colorWithAlpha(homeAccent, '18')}, 0 24px 70px ${colorWithAlpha(awayAccent, '18')}`,
              opacity: scoreOpacity,
              transform: `scale(${scoreScale})`,
            }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: 104,
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
              maxWidth: 320,
              background: `linear-gradient(90deg, ${homeAccent}, ${GOLD}, ${awayAccent})`,
            }}
          />
        </div>
        <TeamPanel team={match.awayTeam} badge={match.awayBadge} align="right" />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 44,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: STEEL,
          fontSize: 22,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        <span>
          Jogo {index + 1} de {total}
        </span>
        <span>Os palpites têm caráter exclusivamente recreativo.</span>
      </div>
    </div>
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
        height: 610,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        justifyContent: 'center',
        gap: 26,
        padding: 38,
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
          fontSize: 70,
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
        width: 170,
        height: 170,
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
          style={{width: 124, height: 124, objectFit: 'contain'}}
        />
      ) : (
        <span style={{color: GOLD, fontSize: 54, fontWeight: 900}}>{badge.label}</span>
      )}
    </div>
  );
};

const Header = ({logoPath, eyebrow}: {logoPath?: string; eyebrow?: string}) => (
  <div
    style={{
      position: 'absolute',
      left: 80,
      right: 80,
      top: 48,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 34,
    }}
  >
    <div
      style={{
        color: eyebrow ? SILVER : GOLD,
        fontSize: 24,
        fontWeight: 800,
        textTransform: 'uppercase',
      }}
    >
      {eyebrow ?? 'Foot Analysis'}
    </div>
    {logoPath ? (
      <Img
        src={staticFile(logoPath.replace(/^\//, ''))}
        style={{width: 184, maxHeight: 88, objectFit: 'contain'}}
      />
    ) : (
      <div style={{color: GOLD, fontSize: 28, fontWeight: 900}}>Foot Analysis</div>
    )}
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
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        opacity,
        textAlign: 'center',
        padding: '74px 120px 64px',
      }}
    >
      <Header logoPath={job.brandLogoPath} eyebrow="" />
      <div style={{color: GOLD, fontSize: 34, fontWeight: 900, textTransform: 'uppercase'}}>
        Todos os palpites
      </div>
      <div
        style={{
          color: WHITE,
          fontSize: 58,
          lineHeight: 0.98,
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        {roundLabel}
      </div>
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
                minHeight: job.matches.length > 14 ? 48 : 58,
                padding: '10px 14px',
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
      <div style={{color: SILVER, fontSize: 30, lineHeight: 1.35, fontWeight: 600}}>
        {job.disclaimer}
      </div>
    </div>
  );
};

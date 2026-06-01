import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {FootballThumbnailJob, FootballThumbnailModel, TeamBadge} from '../lib/types';

type FootballThumbnailCompositionProps = {
  job: FootballThumbnailJob;
};

const colors = {
  bg: '#030504',
  neon: '#A7FF12',
  neonDark: '#74C900',
  white: '#F6F7F2',
  muted: '#B7C0B2',
  black: '#050605',
};

const asStaticSrc = (path?: string) => {
  if (!path) return undefined;
  return staticFile(path.replace(/^\//, ''));
};

const fitText = (text: string, maxLength: number, maxSize: number, minSize: number) => {
  const length = Math.max(text.length, 1);
  if (length <= maxLength) return maxSize;
  return Math.max(minSize, Math.round(maxSize - (length - maxLength) * 2.2));
};

const splitHeadline = (headline: string) => {
  const normalized = headline.trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ').filter(Boolean);
  if (words.length <= 1) {
    return {top: normalized, bottom: ''};
  }

  return {
    top: words.slice(0, -1).join(' '),
    bottom: words.slice(-1).join(' '),
  };
};

const TeamLogo = ({
  team,
  size,
  rotate = 0,
}: {
  team?: TeamBadge;
  size: number;
  rotate?: number;
}) => {
  const logoSrc = asStaticSrc(team?.logoPath ?? team?.imagePath);
  const initials = String(team?.label ?? 'TBA')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        transform: `rotate(${rotate}deg)`,
        filter: `drop-shadow(0 0 18px ${team?.accentColor ?? colors.neon}88) drop-shadow(0 22px 16px rgba(0,0,0,0.72))`,
      }}
    >
      {logoSrc ? (
        <Img
          src={logoSrc}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
          }}
        />
      ) : (
        <div
          style={{
            width: size * 0.86,
            height: size * 0.86,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: '#121512',
            border: `8px solid ${team?.accentColor ?? colors.neon}`,
            color: colors.white,
            fontSize: size * 0.2,
            fontWeight: 950,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

const modelTitles: Record<FootballThumbnailModel, {headline: string; subheadline: string}> = {
  'model-1': {headline: 'PALPITES RODADA 18', subheadline: 'CORRIDA PELO TITULO'},
  'model-2': {headline: 'PALPITES RODADA 18', subheadline: 'QUEM ENTRA NO G4?'},
  'model-3': {headline: 'PALPITES RODADA 18', subheadline: 'ALGUEM CAI HOJE?'},
  'model-4': {headline: 'PALPITES RODADA 18', subheadline: 'RODADA DECISIVA'},
  'model-5': {headline: 'SIMULACAO RODADA 18', subheadline: 'PROBABILIDADE DE VITORIA'},
  'model-6': {headline: 'PALPITES RODADA 18', subheadline: 'ZEBRA A VISTA?'},
  'model-7': {headline: 'PALPITES TODOS OS JOGOS', subheadline: 'DA RODADA 18'},
  'model-8': {headline: 'PALPITES RODADA 18', subheadline: 'G4 E Z4'},
};

const getModelCopy = (job: FootballThumbnailJob) => {
  const model = job.thumbnailModel ?? 'model-4';
  const fallback = modelTitles[model];

  return {
    model,
    headline: String(job.headline || fallback.headline).toUpperCase(),
    subheadline: String(job.subheadline || fallback.subheadline).toUpperCase(),
  };
};

const TitleBlock = ({
  headline,
  subheadline,
  accentColor,
  top = 54,
  left = 230,
  width = 1460,
  align = 'center',
}: {
  headline: string;
  subheadline: string;
  accentColor: string;
  top?: number;
  left?: number;
  width?: number;
  align?: 'left' | 'center';
}) => {
  const words = headline.split(/\s+/).filter(Boolean);
  const lastWord = words.length > 1 ? words.at(-1) ?? '' : '';
  const firstLine = words.length > 1 ? words.slice(0, -1).join(' ') : headline;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        textAlign: align,
        transform: 'skewX(-7deg)',
      }}
    >
      <div
        style={{
          color: colors.white,
          fontSize: fitText(firstLine, 16, 122, 72),
          fontWeight: 950,
          lineHeight: 0.88,
          textTransform: 'uppercase',
          textShadow: '8px 10px 0 rgba(0,0,0,0.86), 0 0 16px rgba(255,255,255,0.22)',
        }}
      >
        {firstLine}
      </div>
      {lastWord ? (
        <div
          style={{
            color: accentColor,
            fontSize: fitText(lastWord, 9, 154, 88),
            fontWeight: 950,
            lineHeight: 0.84,
            textTransform: 'uppercase',
            textShadow: `8px 12px 0 rgba(0,0,0,0.86), 0 0 24px ${accentColor}CC`,
          }}
        >
          {lastWord}
        </div>
      ) : null}
      <BrushLabel label={subheadline} accentColor={accentColor} />
    </div>
  );
};

const BrushLabel = ({
  label,
  accentColor,
  danger = false,
}: {
  label: string;
  accentColor: string;
  danger?: boolean;
}) => (
  <div
    style={{
      display: 'inline-grid',
      placeItems: 'center',
      marginTop: 14,
      minWidth: 620,
      height: 78,
      padding: '0 34px',
      background: danger
        ? 'linear-gradient(90deg, rgba(150,0,0,0.95), #FF2F24, rgba(150,0,0,0.95))'
        : `linear-gradient(90deg, transparent, ${accentColor}, ${accentColor}, transparent)`,
      color: danger ? colors.white : colors.black,
      fontSize: fitText(label, 24, 46, 30),
      fontWeight: 950,
      lineHeight: 1,
      textTransform: 'uppercase',
      boxShadow: `0 0 24px ${danger ? '#FF2F24' : accentColor}88`,
    }}
  >
    {label.replace('PREVISOES', 'PREVISÕES').replace('SIMULACAO', 'SIMULAÇÃO')}
  </div>
);

const teamsFromJob = (job: FootballThumbnailJob) =>
  [job.teamA, job.teamB, job.teamC, job.teamD, job.teamE, job.teamF].filter(Boolean) as TeamBadge[];

const sampleTopRows = (job: FootballThumbnailJob) => {
  const teams = teamsFromJob(job);
  const fallback = [
    job.teamA,
    job.teamB,
    {label: 'Cruzeiro', logoPath: '/logos/cruzeiro.png', accentColor: '#1E5AA8'},
    {label: 'Botafogo', logoPath: '/logos/botafogo.png', accentColor: '#F0F4F8'},
    {label: 'Sao Paulo', logoPath: '/logos/sao-paulo.png', accentColor: '#D71920'},
    {label: 'Bahia', logoPath: '/logos/bahia.png', accentColor: '#1E5AA8'},
  ].filter(Boolean) as TeamBadge[];
  const source = teams.length >= 3 ? teams : fallback;

  return source.slice(0, 6).map((team, index) => ({
    rank: index + 1,
    team,
    points: [38, 37, 35, 28, 27, 26][index] ?? 24 - index,
  }));
};

const sampleBottomRows = () => [
  {rank: 16, team: {label: 'Vasco', logoPath: '/logos/vasco-da-gama.png'}, points: 17},
  {rank: 17, team: {label: 'Juventude', logoPath: '/logos/juventude-152.png'}, points: 16},
  {rank: 18, team: {label: 'Sport', logoPath: '/logos/sport-recife-123.png'}, points: 15},
  {rank: 19, team: {label: 'Vitoria', logoPath: '/logos/vitoria.png'}, points: 13},
  {rank: 20, team: {label: 'Santos', logoPath: '/logos/santos.png'}, points: 12},
];

const TableBox = ({
  rows,
  left,
  top,
  width,
  rowHeight = 76,
  accentColor,
  danger = false,
}: {
  rows: Array<{rank: number; team: TeamBadge; points: number}>;
  left: number;
  top: number;
  width: number;
  rowHeight?: number;
  accentColor: string;
  danger?: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      width,
      border: `2px solid ${danger ? '#FF332B' : accentColor}88`,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: `0 0 24px ${danger ? '#FF332B' : accentColor}55`,
      background: 'rgba(0,0,0,0.62)',
    }}
  >
    {rows.map((row) => (
      <div
        key={`${row.rank}-${row.team.label}`}
        style={{
          height: rowHeight,
          display: 'grid',
          gridTemplateColumns: '70px 58px 1fr 86px',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.16)',
          color: danger ? '#FF382F' : colors.white,
          fontSize: 32,
          fontWeight: 950,
          textTransform: 'uppercase',
        }}
      >
        <span style={{textAlign: 'center', color: danger ? '#FF382F' : accentColor}}>{row.rank}</span>
        <TeamLogo team={row.team} size={44} />
        <span style={{fontSize: fitText(row.team.label, 12, 30, 22)}}>{row.team.label}</span>
        <span style={{textAlign: 'center', color: danger ? '#FF382F' : accentColor}}>{row.points}</span>
      </div>
    ))}
  </div>
);

const SmallBrand = ({accentColor, left = 805, top = 970}: {accentColor: string; left?: number; top?: number}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: colors.white,
      fontSize: 34,
      fontWeight: 950,
      fontStyle: 'italic',
      textTransform: 'uppercase',
      textShadow: '0 4px 10px rgba(0,0,0,0.8)',
    }}
  >
    <div
      style={{
        width: 48,
        height: 34,
        background: `linear-gradient(135deg, ${accentColor} 0 48%, ${colors.white} 49% 100%)`,
        transform: 'skewX(-16deg)',
      }}
    />
    <span>Foot<span style={{color: accentColor}}>Analysis</span></span>
  </div>
);

const ModelContent = ({
  job,
  model,
  headline,
  subheadline,
  accentColor,
}: {
  job: FootballThumbnailJob;
  model: FootballThumbnailModel;
  headline: string;
  subheadline: string;
  accentColor: string;
}) => {
  const topRows = sampleTopRows(job);
  const bottomRows = sampleBottomRows();
  const selectedTeams = teamsFromJob(job);

  if (model === 'model-1') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={560} top={62} width={1120} />
        <div style={{position: 'absolute', left: 150, top: 420, color: '#F6C35B', fontSize: 310, filter: 'drop-shadow(0 0 18px #F6C35B)'}}>
          ♕
        </div>
        <TableBox rows={topRows.slice(0, 3)} left={720} top={462} width={720} accentColor={accentColor} rowHeight={88} />
        <div style={{position: 'absolute', left: 610, top: 760}}>
          <BrushLabel label="3 PONTOS SEPARAM O TOP 3" accentColor={accentColor} />
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-2') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={360} top={54} width={1120} />
        <TableBox rows={topRows.slice(3, 6)} left={358} top={430} width={760} accentColor={accentColor} rowHeight={94} />
        <div
          style={{
            position: 'absolute',
            right: 250,
            top: 410,
            color: accentColor,
            fontSize: 360,
            fontWeight: 950,
            lineHeight: 1,
            textShadow: `0 0 28px ${accentColor}`,
          }}
        >
          ↗
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-3') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={380} top={54} width={1040} />
        <div style={{position: 'absolute', left: 424, top: 420}}>
          <TableBox rows={bottomRows} left={0} top={0} width={720} accentColor={accentColor} danger rowHeight={72} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: 360,
            top: 440,
            color: '#FF352E',
            fontSize: 190,
            fontWeight: 950,
            textAlign: 'center',
            lineHeight: 0.78,
            textShadow: '0 0 28px rgba(255,53,46,0.72)',
          }}
        >
          △<br />Z4
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-4') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={390} top={54} width={1120} />
        {selectedTeams.length >= 4 ? (
          <>
            <TeamPair leftTeam={selectedTeams[0]} rightTeam={selectedTeams[1]} left={90} top={500} size={300} />
            <TeamPair leftTeam={selectedTeams[2]} rightTeam={selectedTeams[3]} left={1210} top={500} size={288} />
          </>
        ) : (
          <>
            <div style={{position: 'absolute', left: 190, top: 500}}>
              <TeamLogo team={job.teamA} size={360} rotate={-5} />
            </div>
            <VsMark left={910} top={670} rotate={-4} />
            <div style={{position: 'absolute', right: 190, top: 500}}>
              <TeamLogo team={job.teamB} size={360} rotate={5} />
            </div>
          </>
        )}
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-5') {
    const rows = [
      {team: job.teamA, pct: 82},
      {team: job.teamB ?? topRows[1].team, pct: 73},
      {team: job.teamC ?? topRows[2].team, pct: 68},
    ];

    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={260} top={76} width={1060} align="left" />
        <div style={{position: 'absolute', left: 290, top: 430, width: 1120}}>
          {rows.map((row, index) => (
            <div
              key={row.team.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 330px 1fr 150px',
                alignItems: 'center',
                gap: 20,
                marginBottom: 34,
                color: colors.white,
                fontSize: 42,
                fontWeight: 950,
                textTransform: 'uppercase',
              }}
            >
              <TeamLogo team={row.team} size={82} />
              <span>{row.team.label}</span>
              <div style={{height: 24, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
                <div style={{width: `${row.pct}%`, height: '100%', background: accentColor, boxShadow: `0 0 16px ${accentColor}`}} />
              </div>
              <span style={{fontSize: 66, textAlign: 'right'}}>{row.pct}%</span>
            </div>
          ))}
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-6') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={430} top={54} width={1060} />
        <div style={{position: 'absolute', left: 450, top: 468}}>
          <TeamLogo team={job.teamA} size={280} rotate={-5} />
        </div>
        <VsMark left={900} top={580} rotate={-3} />
        <div style={{position: 'absolute', right: 430, top: 468}}>
          <TeamLogo team={job.teamB} size={280} rotate={5} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 570,
            top: 802,
            width: 780,
            display: 'grid',
            gridTemplateColumns: '1fr 80px 1fr',
            gap: 20,
            alignItems: 'center',
            color: colors.white,
            fontSize: 72,
            fontWeight: 950,
            textAlign: 'center',
          }}
        >
          <span style={{color: accentColor}}>53%</span>
          <span>x</span>
          <span style={{color: '#FF332B'}}>47%</span>
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  if (model === 'model-7') {
    return (
      <>
        <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={410} top={72} width={1100} />
        <div
          style={{
            position: 'absolute',
            left: 410,
            top: 512,
            width: 1100,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 36,
            color: colors.white,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {[
            ['10', 'JOGOS'],
            ['20', 'TIMES'],
            ['1', 'RODADA'],
          ].map(([value, label]) => (
            <div key={label} style={{borderLeft: `2px solid ${accentColor}88`, borderRight: `2px solid ${accentColor}44`, padding: '28px 0'}}>
              <div style={{fontSize: 96, fontWeight: 950}}>{value}</div>
              <div style={{fontSize: 34, fontWeight: 950}}>{label}</div>
            </div>
          ))}
        </div>
        <SmallBrand accentColor={accentColor} />
      </>
    );
  }

  return (
    <>
      <TitleBlock headline={headline} subheadline={subheadline} accentColor={accentColor} left={460} top={50} width={1000} />
      <TableBox rows={topRows.slice(0, 4)} left={430} top={390} width={920} accentColor={accentColor} rowHeight={66} />
      <div style={{position: 'absolute', right: 420, top: 445, color: accentColor, fontSize: 82, fontWeight: 950}}>G4</div>
      <TableBox rows={bottomRows.slice(1, 5)} left={430} top={694} width={920} accentColor={accentColor} danger rowHeight={66} />
      <div style={{position: 'absolute', right: 420, top: 748, color: '#FF332B', fontSize: 82, fontWeight: 950}}>Z4</div>
      <SmallBrand accentColor={accentColor} />
    </>
  );
};

const VsMark = ({left, top, rotate = -6}: {left: number; top: number; rotate?: number}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      color: colors.neon,
      fontSize: 72,
      fontWeight: 950,
      fontStyle: 'italic',
      lineHeight: 1,
      transform: `rotate(${rotate}deg) skewX(-10deg)`,
      textShadow: '0 0 18px rgba(167,255,18,0.78), 0 10px 10px rgba(0,0,0,0.8)',
    }}
  >
    VS
  </div>
);

const SmokeLayer = () => (
  <>
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: -90 + index * 430,
          bottom: 64 + (index % 2) * 28,
          width: 460,
          height: 190,
          borderRadius: 999,
          background:
            'radial-gradient(circle, rgba(167,255,18,0.42), rgba(116,201,0,0.18) 44%, transparent 72%)',
          filter: 'blur(24px)',
          opacity: 0.72,
          transform: `rotate(${index % 2 === 0 ? -8 : 9}deg)`,
        }}
      />
    ))}
  </>
);

const StadiumLights = () => (
  <>
    <div
      style={{
        position: 'absolute',
        left: -40,
        top: 374,
        width: 380,
        height: 220,
        background:
          'repeating-linear-gradient(105deg, rgba(255,255,255,0.78) 0 6px, transparent 6px 24px)',
        opacity: 0.18,
        transform: 'skewY(-12deg)',
        filter: 'blur(1px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: -46,
        top: 364,
        width: 390,
        height: 220,
        background:
          'repeating-linear-gradient(75deg, rgba(255,255,255,0.78) 0 6px, transparent 6px 24px)',
        opacity: 0.18,
        transform: 'skewY(12deg)',
        filter: 'blur(1px)',
      }}
    />
  </>
);

const TeamPair = ({
  leftTeam,
  rightTeam,
  left,
  top,
  size,
}: {
  leftTeam?: TeamBadge;
  rightTeam?: TeamBadge;
  left: number;
  top: number;
  size: number;
}) => (
  <>
    <div style={{position: 'absolute', left, top}}>
      <TeamLogo team={leftTeam} size={size} rotate={-5} />
    </div>
    <VsMark left={left + size - 6} top={top + size * 0.54} />
    <div style={{position: 'absolute', left: left + size + 108, top: top + 26}}>
      <TeamLogo team={rightTeam} size={size * 0.9} rotate={5} />
    </div>
  </>
);

export const FootballThumbnailComposition = ({job}: FootballThumbnailCompositionProps) => {
  const isEnglish = job.channelProfile === 'en' || job.languageProfile === 'en';
  const accentColor = job.accentColor ?? (isEnglish ? '#A7FF12' : colors.neon);
  const secondaryAccentColor = job.secondaryAccentColor ?? colors.neonDark;
  const copy = getModelCopy(job);
  const backgroundSrc = asStaticSrc(job.backgroundImagePath);
  const hasCustomBackground = Boolean(backgroundSrc);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: colors.bg,
        color: colors.white,
        fontFamily: '"Arial Black", "Poppins", "Impact", sans-serif',
      }}
    >
      {backgroundSrc ? (
        <Img
          src={backgroundSrc}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.92,
          }}
        />
      ) : null}

      {!hasCustomBackground ? (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 42%, rgba(167,255,18,0.13), transparent 24%), radial-gradient(circle at 20% 72%, rgba(167,255,18,0.2), transparent 25%), radial-gradient(circle at 82% 70%, rgba(167,255,18,0.24), transparent 25%), linear-gradient(180deg, #010201 0%, #060806 48%, #010201 100%)',
            }}
          />
          <StadiumLights />
          <SmokeLayer />
        </>
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: hasCustomBackground ? 0.12 : 0.22,
          background:
            'repeating-linear-gradient(0deg, transparent 0 7px, rgba(255,255,255,0.08) 8px), repeating-linear-gradient(90deg, transparent 0 11px, rgba(167,255,18,0.05) 12px)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.62), transparent 18%, transparent 82%, rgba(0,0,0,0.66)), linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.68))',
        }}
      />

      <ModelContent
        job={job}
        model={copy.model}
        headline={copy.headline}
        subheadline={copy.subheadline}
        accentColor={accentColor}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 76,
          background: `linear-gradient(0deg, rgba(0,0,0,0.72), transparent), radial-gradient(circle at 50% 100%, ${secondaryAccentColor}33, transparent 64%)`,
        }}
      />
    </AbsoluteFill>
  );
};

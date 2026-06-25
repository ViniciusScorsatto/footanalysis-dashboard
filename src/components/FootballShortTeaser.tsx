import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import type React from 'react';
import {BrandMark} from './BrandMark';
import {
  FootballShortFontFaces,
  SHORT_INTRO_DURATION_FRAMES,
  SHORT_TEASER_DURATION_FRAMES,
  TEASER_HEADLINE_EFFECT,
  TEASER_HEADLINE_FONT,
  TEASER_LABEL_FONT,
  TEASER_NUMBER_EFFECT,
  TEASER_NUMBER_FONT,
  TeaserBackdrop,
  pickFootballShortBackground,
} from './FootballShortTeaserKit';
import type {FootballShortTeaserVariant} from './FootballShortTeaserKit';
import {
  normalizeTeamKey,
  orderFixtureTeaserItems,
  teamAccentColor,
} from './footballShortTeamVisuals';
import type {
  ContinentalGroupStandingsGroup,
  FixtureCard,
  FootballChannelProfile,
  FootballVideoTemplate,
  PaceEntry,
  PlayerOfRoundEntry,
  SeasonFinalVerdictGroup,
  StandingRow,
  TeamBadge,
  TierlistGroup,
  TopScorerEntry,
  WorldCupGroupResult,
  WorldCupGroupRow,
  WorldCupKnockoutMatch,
  WorldCupNextMatch,
} from '../lib/types';

type FootballShortTeaserProps = {
  template: FootballVideoTemplate;
  variant?: FootballShortTeaserVariant;
  channelProfile?: FootballChannelProfile;
  leagueName: string;
  roundLabel?: string;
  titleLabel?: string;
  subtitleLabel?: string;
  phaseLabel?: string;
  groupLabel?: string;
  seasonLabel?: string;
  benchmarkPercentage?: number;
  benchmarkLabel?: string;
  accentColor: string;
  secondaryAccentColor?: string;
  fixtures?: FixtureCard[];
  rows?: Array<StandingRow | WorldCupGroupRow>;
  entries?: Array<TopScorerEntry | PlayerOfRoundEntry | PaceEntry>;
  championTeam?: string;
  championBadge?: TeamBadge;
  finalFixture?: FixtureCard;
  qualificationGroups?: SeasonFinalVerdictGroup[];
  relegationGroup?: SeasonFinalVerdictGroup;
  groups?: ContinentalGroupStandingsGroup[];
  tiers?: TierlistGroup[];
  topScorerPrediction?: string;
  bestPlayerPrediction?: string;
  nextMatches?: WorldCupNextMatch[];
  lastResults?: WorldCupGroupResult[];
  matches?: WorldCupKnockoutMatch[];
  brandName?: string;
  brandLogoPath?: string;
};

type HeroTeam = {
  name: string;
  badge?: TeamBadge;
};

const text = (value: unknown) => String(value ?? '').trim();

const badgeSrc = (badge?: TeamBadge) => {
  const source = badge?.logoPath ?? badge?.imagePath;
  return source ? staticFile(source.replace(/^\//, '')) : null;
};

const hasScore = (fixture?: FixtureCard | WorldCupGroupResult | WorldCupKnockoutMatch) =>
  fixture?.homeScore !== null &&
  fixture?.awayScore !== null &&
  fixture?.homeScore !== undefined &&
  fixture?.awayScore !== undefined;

const fixtureScore = (fixture?: FixtureCard | WorldCupGroupResult | WorldCupKnockoutMatch) =>
  hasScore(fixture) ? `${fixture?.homeScore} x ${fixture?.awayScore}` : 'x';

const fixtureTeams = (fixture?: FixtureCard | WorldCupGroupResult | WorldCupKnockoutMatch) => ({
  home: text(fixture?.homeTeam),
  away: text(fixture?.awayTeam),
  homeBadge: fixture?.homeBadge,
  awayBadge: fixture?.awayBadge,
});

const shortTeam = (value: string) =>
  value
    .replace(/\b(fc|sc|ec|afc|club)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18);

const getRankName = (row?: StandingRow | WorldCupGroupRow | PaceEntry) =>
  text('team' in (row ?? {}) ? row?.team : '');

const getPlayerName = (entry?: TopScorerEntry | PlayerOfRoundEntry | PaceEntry) =>
  text('playerName' in (entry ?? {}) ? entry?.playerName : 'team' in (entry ?? {}) ? entry?.team : '');

const getEntryBadge = (entry?: TopScorerEntry | PlayerOfRoundEntry | PaceEntry) =>
  'badge' in (entry ?? {}) ? entry?.badge : undefined;

const firstTierEntry = (tiers?: TierlistGroup[], key = 'champion') =>
  tiers?.find((tier) => tier.key === key)?.entries?.[0] ?? tiers?.find((tier) => tier.entries.length)?.entries?.[0];

const tierlistPosterTeams = (tiers?: TierlistGroup[]) => {
  const entries = tiers?.flatMap((tier) => tier.entries.map((entry) => ({...entry, tierKey: tier.key}))) ?? [];
  const priority = ['champion', 'finalist', 'semifinalist', 'favorites', 'quarterfinalist', 'surprise', 'dark-horse'];
  const seen = new Set<string>();

  return entries
    .sort((left, right) => {
      const leftPriority = priority.indexOf(left.tierKey);
      const rightPriority = priority.indexOf(right.tierKey);

      return (leftPriority === -1 ? 99 : leftPriority) - (rightPriority === -1 ? 99 : rightPriority);
    })
    .filter((entry) => {
      const key = normalizeTeamKey(entry.team);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 16);
};

const pickTemplateLabel = ({
  template,
  variant,
  isEnglish,
}: {
  template: FootballVideoTemplate;
  variant?: FootballShortTeaserProps['variant'];
  isEnglish: boolean;
}) => {
  if (variant === 'results') return isEnglish ? 'Results' : 'Resultados';
  if (variant === 'next-games') return isEnglish ? 'Fixtures' : 'Próximos Jogos';
  if (variant === 'predictions') return isEnglish ? 'Prediction' : 'Palpite';
  if (variant === 'championship') return isEnglish ? 'Title Race' : 'Ritmo de Campeão';
  if (variant === 'relegation') return isEnglish ? 'Danger Zone' : 'Linha do Rebaixamento';

  const labels: Partial<Record<FootballVideoTemplate, string>> = {
    standings: isEnglish ? 'Table Update' : 'Classificação Atualizada',
    'top-scorers': isEnglish ? 'Top Scorers' : 'Artilharia',
    'player-of-round': isEnglish ? 'Player Ranking' : 'Craque da Rodada',
    'season-final-verdict': isEnglish ? 'Final Verdict' : 'Resumo Final',
    'champion-final': isEnglish ? 'Champion' : 'Campeão',
    tierlist: isEnglish ? 'Favorites' : 'Favoritos',
    'continental-groups-standings': isEnglish ? 'Group Race' : 'Grupos',
    'world-cup-group-standings': isEnglish ? 'Group Table' : 'Tabela do Grupo',
    'world-cup-knockout': isEnglish ? 'Knockout' : 'Mata-Mata',
  };

  return labels[template] ?? (isEnglish ? 'Football Update' : 'Atualização');
};

const MiniBadge = ({badge, label, size = 96}: {badge?: TeamBadge; label: string; size?: number}) => {
  const src = badgeSrc(badge);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(145deg, rgba(240,244,248,0.14), rgba(15,19,24,0.78))',
        border: '1px solid rgba(240,244,248,0.18)',
        boxShadow: '0 18px 36px rgba(0,0,0,0.42)',
        overflow: 'hidden',
      }}
    >
      {src ? (
        <Img
          src={src}
          style={{
            width: size * 0.76,
            height: size * 0.76,
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.45))',
          }}
        />
      ) : (
        <span
          style={{
            maxWidth: size - 16,
            color: '#f0f4f8',
            fontSize: Math.max(18, size * 0.2),
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 0.9,
          }}
        >
          {label.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
};

const FixtureBadge = ({
  badge,
  label,
  size = 96,
  align = 'left',
}: {
  badge?: TeamBadge;
  label: string;
  size?: number;
  align?: 'left' | 'right';
}) => {
  const src = badgeSrc(badge);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {src ? (
        <Img
          src={src}
          style={{
            width: size * 0.94,
            height: size * 0.94,
            objectFit: 'contain',
            transformOrigin: 'center',
            filter:
              'drop-shadow(0 18px 20px rgba(0,0,0,0.68)) drop-shadow(0 0 10px rgba(255,255,255,0.58)) drop-shadow(0 0 22px rgba(255,255,255,0.22))',
          }}
        />
      ) : (
        <div
          style={{
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: size,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(15,19,24,0.86)',
            color: '#f0f4f8',
            fontSize: size * 0.28,
            fontWeight: 900,
            textAlign: 'center',
            textTransform: 'uppercase',
            boxShadow: '0 18px 22px rgba(0,0,0,0.64), 0 0 18px rgba(255,255,255,0.26)',
          }}
        >
          {label.slice(0, 3)}
        </div>
      )}
    </div>
  );
};

const BadgeStrip = ({teams}: {teams: HeroTeam[]}) => (
  <div style={{display: 'flex', justifyContent: 'center', gap: 26, minHeight: 98}}>
    {teams.slice(0, 5).map((team, index) => (
      <MiniBadge key={`${team.name}-${index}`} badge={team.badge} label={team.name} size={92} />
    ))}
  </div>
);

const MoreChip = ({
  count,
  accentColor,
  isEnglish,
}: {
  count: number;
  accentColor: string;
  isEnglish: boolean;
}) =>
  count > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom: 184,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          padding: '16px 26px 13px',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
          color: '#0b0d12',
          fontSize: 32,
          lineHeight: 1,
          fontWeight: 900,
          textTransform: 'uppercase',
          boxShadow: `0 0 26px ${accentColor}55, 0 18px 34px rgba(0,0,0,0.35)`,
        }}
      >
        {isEnglish ? `And ${count} more...` : `E mais ${count}...`}
      </div>
    </div>
  ) : null;

const MainMatch = ({
  fixture,
  label,
  accentColor,
}: {
  fixture?: FixtureCard | WorldCupGroupResult | WorldCupKnockoutMatch;
  label: string;
  accentColor: string;
}) => {
  const teams = fixtureTeams(fixture);

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 260px 1fr', alignItems: 'center', gap: 24}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <MiniBadge badge={teams.homeBadge} label={teams.home} size={154} />
        <TeamName>{teams.home || label}</TeamName>
      </div>
      <div
        style={{
          ...TEASER_NUMBER_EFFECT,
          color: accentColor,
          fontSize: hasScore(fixture) ? 94 : 96,
          lineHeight: 0.85,
          fontWeight: 900,
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textShadow: `0 0 26px ${accentColor}66`,
        }}
      >
        {fixtureScore(fixture)}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <MiniBadge badge={teams.awayBadge} label={teams.away} size={154} />
        <TeamName>{teams.away || label}</TeamName>
      </div>
    </div>
  );
};

const TeamName = ({children}: {children: React.ReactNode}) => (
  <div
    style={{
      maxWidth: 280,
      color: '#f0f4f8',
      fontSize: 50,
      lineHeight: 0.92,
      fontWeight: 900,
      textAlign: 'center',
      textTransform: 'uppercase',
      textWrap: 'balance',
    }}
  >
    {children}
  </div>
);

const BrushTitle = ({
  children,
  accentColor,
  dark = false,
}: {
  children: React.ReactNode;
  accentColor: string;
  dark?: boolean;
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignSelf: 'center',
      padding: '16px 38px 13px',
      background: dark ? '#f0f4f8' : accentColor,
      color: dark ? '#0b0d12' : '#0b0d12',
      fontSize: 42,
      lineHeight: 1,
      fontWeight: 900,
      fontFamily: TEASER_LABEL_FONT,
      letterSpacing: 0,
      textTransform: 'uppercase',
      transform: 'skewX(-8deg)',
      boxShadow: `0 0 30px ${accentColor}66`,
      clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0 100%)',
    }}
  >
    <span style={{transform: 'skewX(8deg)'}}>{children}</span>
  </div>
);

const PosterShell = ({
  leagueName,
  label,
  accentColor,
  children,
  footer,
}: {
  leagueName: string;
  label: string;
  accentColor: string;
  children: React.ReactNode;
  footer: string;
}) => (
  <div
    style={{
      position: 'absolute',
      inset: '52px 54px 54px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 24,
    }}
  >
    <BrushTitle accentColor={accentColor}>{leagueName}</BrushTitle>
    <div
      style={{
        color: '#f0f4f8',
        fontSize: label.length > 18 ? 108 : 136,
        lineHeight: 0.78,
        fontWeight: 900,
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadow: '0 8px 28px rgba(0,0,0,0.75)',
      }}
    >
      {label}
    </div>
    <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>{children}</div>
    <BrushTitle accentColor={accentColor}>{footer}</BrushTitle>
  </div>
);

const FixtureTeaserPoster = ({
  fixtures,
  accentColor,
  mode,
  leagueName,
  label,
  metaLabel,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  fixtures: FixtureCard[];
  accentColor: string;
  mode: 'score' | 'fixture' | 'prediction';
  leagueName: string;
  label: string;
  metaLabel?: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const orderedFixtures = orderFixtureTeaserItems(fixtures, mode === 'score' ? 'results' : mode === 'prediction' ? 'predictions' : 'next-games');
  const [heroFixture, ...remainingFixtures] = orderedFixtures;
  const secondaryFixtures = remainingFixtures.slice(0, 3);
  const hiddenCount = Math.max(0, remainingFixtures.length - secondaryFixtures.length);
  const hasSecondary = secondaryFixtures.length > 0;

  if (!heroFixture) {
    return null;
  }

  const footerText =
    mode === 'prediction'
      ? isEnglish
        ? '+ PICKS IN SEQUENCE'
        : '+ PALPITES NA SEQUÊNCIA'
      : mode === 'fixture'
        ? isEnglish
          ? '+ GAMES IN SEQUENCE'
          : '+ JOGOS NA SEQUÊNCIA'
        : isEnglish
          ? '+ RESULTS IN SEQUENCE'
          : '+ RESULTADOS NA SEQUÊNCIA';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={accentColor} />
      <div
        style={{
          position: 'absolute',
          inset: '36px 42px 42px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 18,
        }}
      >
      <div style={{display: 'flex', justifyContent: 'center', minHeight: 96}}>
        {brandName ? <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} /> : null}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
        <div
          style={{
            padding: '10px 28px 8px',
            borderRadius: 10,
            border: `1px solid ${accentColor}88`,
            color: accentColor,
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 7,
            textTransform: 'uppercase',
            background: 'rgba(15,19,24,0.92)',
            boxShadow: `0 0 24px ${accentColor}44`,
          }}
        >
          {leagueName}
        </div>
        <div
          style={{
            position: 'relative',
            padding: '18px 48px 14px',
            minWidth: 720,
            textAlign: 'center',
            borderRadius: 18,
            border: `2px solid ${accentColor}`,
            background: 'linear-gradient(180deg, rgba(20,28,36,0.96), rgba(8,10,12,0.96))',
            boxShadow: `0 0 30px ${accentColor}52, inset 0 0 30px rgba(240,244,248,0.05)`,
          }}
        >
          <div
            style={{
              color: '#f0f4f8',
              fontSize: label.length > 14 ? 88 : 106,
              lineHeight: 0.86,
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              textShadow: '0 8px 22px rgba(0,0,0,0.55)',
            }}
          >
            {label}
          </div>
        </div>
        {metaLabel ? (
          <div
            style={{
              padding: '8px 22px 6px',
              borderRadius: 10,
              border: `1px solid ${accentColor}77`,
              background: 'rgba(15,19,24,0.86)',
              color: '#f0f4f8',
              fontSize: 32,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            {metaLabel}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasSecondary ? 'flex-start' : 'center',
          gap: hasSecondary ? 18 : 0,
          paddingTop: hasSecondary ? 34 : 18,
        }}
      >
        <HeroFixturePanel
          fixture={heroFixture}
        accentColor={accentColor}
        mode={mode}
        secondaryCount={secondaryFixtures.length}
      />

        {hasSecondary ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            {secondaryFixtures.map((fixture, index) => (
              <SecondaryFixtureRow
                key={`${fixture.homeTeam}-${fixture.awayTeam}-${index}`}
                fixture={fixture}
                accentColor={accentColor}
                mode={mode}
              />
            ))}
          </div>
        ) : null}

        {hasSecondary || hiddenCount > 0 ? (
          <div
            style={{
              alignSelf: 'center',
              marginTop: hasSecondary ? 8 : 24,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: accentColor,
              fontSize: 30,
              lineHeight: 0.9,
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            <span>{footerText}</span>
            <span style={{fontSize: 42, letterSpacing: -4}}>»</span>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
};

const HeroFixturePanel = ({
  fixture,
  accentColor,
  mode,
  secondaryCount,
}: {
  fixture: FixtureCard;
  accentColor: string;
  mode: 'score' | 'fixture' | 'prediction';
  secondaryCount: number;
}) => {
  const teams = fixtureTeams(fixture);
  const scoreText = mode === 'fixture' && !hasScore(fixture) ? 'x' : fixtureScore(fixture);
  const isSingle = secondaryCount === 0;
  const panelHeight = secondaryCount === 0 ? 900 : secondaryCount === 1 ? 700 : secondaryCount === 2 ? 600 : 500;
  const badgeSize = secondaryCount === 0 ? 270 : secondaryCount === 1 ? 250 : 220;

  return (
    <div
      style={{
        minHeight: panelHeight,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 320px) 240px minmax(0, 320px)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 26,
        padding: isSingle ? '58px 34px 52px' : '34px 30px 30px',
        borderRadius: 34,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      <HeroFixtureTeam team={teams.home} badge={teams.homeBadge} accentColor={accentColor} badgeSize={badgeSize} isSingle={isSingle} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div
          style={{
            ...TEASER_NUMBER_EFFECT,
            color: '#f0f4f8',
            fontSize: isSingle ? 154 : 136,
            lineHeight: 0.82,
            fontWeight: 900,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            textShadow: `0 0 28px ${accentColor}88, 0 14px 30px rgba(0,0,0,0.82)`,
          }}
        >
          {scoreText}
        </div>
      </div>
      <HeroFixtureTeam
        team={teams.away}
        badge={teams.awayBadge}
        accentColor={accentColor}
        align="right"
        badgeSize={badgeSize}
        isSingle={isSingle}
      />
    </div>
  );
};

const HeroFixtureTeam = ({
  team,
  badge,
  accentColor,
  align = 'left',
  badgeSize,
  isSingle,
}: {
  team: string;
  badge?: TeamBadge;
  accentColor: string;
  align?: 'left' | 'right';
  badgeSize: number;
  isSingle: boolean;
}) => {
  const label = String(team ?? '');
  const fontSize = isSingle
    ? label.length > 15
      ? 38
      : label.length > 11
        ? 44
        : 56
    : label.length > 15
      ? 28
      : label.length > 11
        ? 34
        : label.length > 8
          ? 40
          : 46;

  return (
    <div
      style={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        textAlign: 'center',
      }}
    >
      <FixtureBadge badge={badge} label={team} size={badgeSize} align={align} />
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          minHeight: isSingle ? 96 : 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f0f4f8',
          fontSize,
          lineHeight: 0.9,
          fontWeight: 900,
          textTransform: 'uppercase',
          textAlign: 'center',
          textWrap: 'balance',
          overflow: 'hidden',
          overflowWrap: 'anywhere',
          textShadow: `0 0 16px ${accentColor}66, 0 8px 20px rgba(0,0,0,0.9)`,
        }}
      >
        {team}
      </div>
    </div>
  );
};

const SecondaryFixtureRow = ({
  fixture,
  accentColor,
  mode,
}: {
  fixture: FixtureCard;
  accentColor: string;
  mode: 'score' | 'fixture' | 'prediction';
}) => {
  const teams = fixtureTeams(fixture);
  const scoreText = mode === 'fixture' && !hasScore(fixture) ? 'x' : fixtureScore(fixture);

  return (
    <div
      style={{
        minHeight: 150,
        display: 'grid',
        gridTemplateColumns: '132px 144px 132px',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
        padding: '12px 28px',
        borderRadius: 18,
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      <FixtureBadge badge={teams.homeBadge} label={teams.home} size={128} align="center" />
      <div
        style={{
          ...TEASER_NUMBER_EFFECT,
          color: '#f0f4f8',
          fontSize: 64,
          lineHeight: 0.9,
          fontWeight: 900,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          textShadow: `0 0 18px ${accentColor}77, 0 8px 18px rgba(0,0,0,0.82)`,
        }}
      >
        {scoreText}
      </div>
      <FixtureBadge badge={teams.awayBadge} label={teams.away} size={128} align="center" />
    </div>
  );
};

const TopScorersTeaserPoster = ({
  entries,
  leagueName,
  titleLabel,
  subtitleLabel,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  entries: TopScorerEntry[];
  leagueName: string;
  titleLabel: string;
  subtitleLabel?: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const [leader, ...chasers] = entries;
  const teamAccent = teamAccentColor(leader?.team ?? '', leader?.badge, accentColor);
  const secondary = chasers.slice(0, 2);
  const titleWords = titleLabel.trim() || (isEnglish ? 'Top Scorers' : 'Artilheiros');
  const secondaryTitle =
    subtitleLabel?.toLowerCase().includes('rodada') || titleWords.toLowerCase().includes('rodada')
      ? isEnglish
        ? 'OF THE ROUND'
        : 'DA RODADA'
      : isEnglish
        ? 'RACE'
        : 'DO CAMPEONATO';
  const titleFontSize = titleWords.length > 16 ? 90 : titleWords.length > 10 ? 112 : 124;
  const secondaryTitleFontSize = secondaryTitle.length > 12 ? 74 : secondaryTitle.length > 9 ? 82 : 94;

  if (!leader) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#050806',
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={teamAccent} intensity={1.12} />
      <Img
        src={staticFile('backgrounds/top-scorers-player-silhouette.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.72,
          filter: `saturate(1.15) hue-rotate(${teamAccent === '#1E5AA8' || teamAccent === '#2E86DE' ? '95deg' : '0deg'})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 50% 52%, ${teamAccent}8a, transparent 34%), ` +
            'linear-gradient(180deg, rgba(0,0,0,0.38), rgba(0,0,0,0.24) 44%, rgba(0,0,0,0.74))',
          mixBlendMode: 'screen',
          opacity: 0.86,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.08) 38%, rgba(0,0,0,0.68) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 58,
          right: 58,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <BrushTitle accentColor={accentColor}>{leagueName}</BrushTitle>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 132,
          left: 78,
          right: 78,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: '#f0f4f8',
            fontSize: titleFontSize,
            lineHeight: 0.8,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: '0 10px 28px rgba(0,0,0,0.82)',
            whiteSpace: 'nowrap',
          }}
        >
          {titleWords}
        </div>
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            marginTop: 8,
            color: accentColor,
            fontSize: secondaryTitleFontSize,
            lineHeight: 0.78,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: `0 0 28px ${accentColor}88, 0 10px 28px rgba(0,0,0,0.74)`,
            whiteSpace: 'nowrap',
          }}
        >
          {secondaryTitle}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 58,
          right: 58,
          top: 500,
          display: 'grid',
          gridTemplateColumns: '160px 1fr 260px',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            justifySelf: 'center',
            padding: '16px 18px 12px',
            borderRadius: 14,
            border: `2px solid ${teamAccent}`,
            color: teamAccent,
            fontSize: 64,
            lineHeight: 0.82,
            fontWeight: 900,
            fontStyle: 'italic',
            boxShadow: `0 0 24px ${teamAccent}66`,
            background: `linear-gradient(135deg, rgba(5,8,6,0.88), ${teamAccent}22)`,
          }}
        >
          {leader.rank}º
        </div>
        <div style={{display: 'grid', placeItems: 'center'}}>
          <MiniBadge badge={leader.badge} label={leader.team} size={300} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <div
            style={{
              ...TEASER_NUMBER_EFFECT,
              color: teamAccent,
              fontSize: 188,
              lineHeight: 0.78,
              fontWeight: 900,
              fontStyle: 'italic',
              textShadow: `0 0 30px ${teamAccent}88, 0 12px 30px rgba(0,0,0,0.72)`,
            }}
          >
            {leader.goals}
          </div>
          <div
            style={{
              color: '#f0f4f8',
              fontSize: 48,
              lineHeight: 0.9,
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
            }}
          >
            {isEnglish ? 'Goals' : 'Gols'}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 260,
          right: 260,
          top: 1032,
          padding: '18px 22px 14px',
          borderRadius: 16,
          border: `2px solid ${teamAccent}aa`,
          background: `linear-gradient(135deg, rgba(5,8,6,0.82), ${teamAccent}28)`,
          boxShadow: `0 0 24px ${teamAccent}55`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: '#f0f4f8',
            fontSize: 62,
            lineHeight: 0.9,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: '0 8px 20px rgba(0,0,0,0.72)',
          }}
        >
          {leader.playerName}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -32,
            transform: 'translateX(-50%) skewX(-8deg)',
            padding: '8px 22px 6px',
            background: teamAccent,
            color: '#0b0d12',
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          <span style={{display: 'block', transform: 'skewX(8deg)'}}>{leader.team}</span>
        </div>
      </div>

      {secondary.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 58,
            right: 58,
            bottom: 142,
            display: 'grid',
            gridTemplateColumns: `repeat(${secondary.length}, 1fr)`,
            gap: 0,
            borderRadius: 22,
            overflow: 'hidden',
            border: '1px solid rgba(240,244,248,0.5)',
            background: 'rgba(5,8,6,0.70)',
          }}
        >
          {secondary.map((entry, index) => (
            <TopScorerChaserCard
              key={`${entry.rank}-${entry.playerName}-${entry.team}`}
              entry={entry}
              accentColor={teamAccentColor(entry.team, entry.badge, accentColor)}
              divider={index > 0}
              isEnglish={isEnglish}
            />
          ))}
        </div>
      ) : null}

      {brandName ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}
    </div>
  );
};

const TopScorerChaserCard = ({
  entry,
  accentColor,
  divider,
  isEnglish,
}: {
  entry: TopScorerEntry;
  accentColor: string;
  divider: boolean;
  isEnglish: boolean;
}) => (
  <div
    style={{
      position: 'relative',
      minHeight: 230,
      display: 'grid',
      gridTemplateColumns: '112px minmax(0, 1fr) 82px',
      alignItems: 'center',
      gap: 14,
      padding: '28px 18px 22px 28px',
      borderLeft: divider ? '1px solid rgba(240,244,248,0.28)' : undefined,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 18,
        minWidth: 52,
        padding: '6px 8px 5px',
        borderRadius: 10,
        border: `1px solid ${accentColor}`,
        color: '#f0f4f8',
        background: 'rgba(5,8,6,0.78)',
        fontSize: 34,
        lineHeight: 0.9,
        fontWeight: 900,
        fontStyle: 'italic',
        textAlign: 'center',
      }}
    >
      {entry.rank}º
    </div>
    <MiniBadge badge={entry.badge} label={entry.team} size={104} />
    <div style={{minWidth: 0, paddingLeft: 2}}>
      <div
        style={{
          color: '#f0f4f8',
          fontSize: entry.playerName.length > 18 ? 27 : entry.playerName.length > 14 ? 30 : 34,
          lineHeight: 0.88,
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          overflowWrap: 'normal',
          wordBreak: 'normal',
          hyphens: 'none',
        }}
      >
        {entry.playerName}
      </div>
      <div
        style={{
          marginTop: 10,
          color: accentColor,
          fontSize: entry.team.length > 12 ? 22 : 25,
          lineHeight: 1,
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {entry.team}
      </div>
    </div>
    <div style={{textAlign: 'center'}}>
      <div style={{...TEASER_NUMBER_EFFECT, color: '#f0f4f8', fontSize: 72, lineHeight: 0.82, fontWeight: 900}}>
        {entry.goals}
      </div>
      <div style={{color: '#f0f4f8', fontSize: 21, lineHeight: 1, fontWeight: 900, textTransform: 'uppercase'}}>
        {isEnglish ? 'Goals' : 'Gols'}
      </div>
    </div>
  </div>
);

const standingPoints = (row: StandingRow | WorldCupGroupRow) => ('points' in row ? row.points : 0);

const standingForm = (row: StandingRow | WorldCupGroupRow) =>
  'form' in row && row.form ? row.form.slice(0, 5).toUpperCase().split('') : [];

const fitStandingsTeaserTeamFontSize = (team: string, maxSize: number, targetWidth: number) => {
  const weightedLength = [...String(team ?? '').trim().toUpperCase()].reduce((total, char) => {
    if (char === ' ') return total + 0.38;
    if ('1IÍÌÎÏL.'.includes(char)) return total + 0.42;
    if ('MW@'.includes(char)) return total + 1.16;
    if ('-–/'.includes(char)) return total + 0.5;
    return total + 0.78;
  }, 0);
  const fitted = Math.floor(targetWidth / Math.max(1, weightedLength));
  return Math.max(24, Math.min(maxSize, fitted));
};

const formDotColor = (result: string) => {
  if (result === 'W' || result === 'V') return '#79D84A';
  if (result === 'D' || result === 'E') return '#8CA0B4';
  if (result === 'L') return '#E74C3C';
  return '#8CA0B4';
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

const rgbToHex = ({r, g, b}: {r: number; g: number; b: number}) =>
  `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;

const mixHex = (from: string, to: string, progress: number) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const pct = Math.max(0, Math.min(1, progress));

  return rgbToHex({
    r: start.r + (end.r - start.r) * pct,
    g: start.g + (end.g - start.g) * pct,
    b: start.b + (end.b - start.b) * pct,
  });
};

const gradientColorForIndex = (index: number, count: number, from: string, to: string) =>
  mixHex(from, to, count <= 1 ? 1 : index / (count - 1));

const accentRgba = (accentColor: string, opacity: number) => {
  const rgb = hexToRgb(accentColor);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

const StandingsTeaserPoster = ({
  rows,
  leagueName,
  metaLabel,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  rows: Array<StandingRow | WorldCupGroupRow>;
  leagueName: string;
  metaLabel?: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const topRows = rows.slice(0, Math.min(5, rows.length));
  const bottomRows = rows.length > 8 ? rows.slice(-4) : [];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background:
          `radial-gradient(circle at 50% 20%, ${accentColor}22, transparent 34%), ` +
          'radial-gradient(circle at 10% 34%, rgba(240,244,248,0.08), transparent 24%), #06090f',
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={accentColor} intensity={0.82} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(rgba(240,244,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(240,244,248,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 12,
          background: accentColor,
          boxShadow: `0 0 28px ${accentColor}88`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 72,
          right: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {brandName ? <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} /> : null}
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: '#f0f4f8',
            fontSize: isEnglish ? 118 : 124,
            lineHeight: 0.78,
            fontWeight: 900,
            fontStyle: 'italic',
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: `0 0 28px ${accentColor}55, 0 12px 32px rgba(0,0,0,0.82)`,
          }}
        >
          {isEnglish ? 'STANDINGS' : 'TABELA'}
        </div>
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: accentColor,
            fontSize: isEnglish ? 88 : 94,
            lineHeight: 0.82,
            fontWeight: 900,
            fontStyle: 'italic',
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: `0 0 26px ${accentColor}77, 0 10px 28px rgba(0,0,0,0.72)`,
          }}
        >
          {isEnglish ? 'UPDATED' : 'ATUALIZADA'}
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            color: accentColor,
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          <span>★</span>
          <span>{leagueName}</span>
          <span>★</span>
        </div>
        {metaLabel ? (
          <div
            style={{
              padding: '8px 24px 6px',
              borderRadius: 10,
              border: `1px solid ${accentColor}88`,
              background: 'rgba(15,19,24,0.9)',
              color: '#f0f4f8',
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            {metaLabel}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 26,
            overflow: 'hidden',
            border: `2px solid ${accentColor}aa`,
            boxShadow: `0 0 28px ${accentColor}55, 0 18px 46px rgba(0,0,0,0.42)`,
            background: 'rgba(6,9,15,0.74)',
          }}
        >
          <StandingsHeaderRow accentColor={accentColor} isEnglish={isEnglish} />
          {topRows.map((row, index) => (
            <StandingsTeaserRow
              key={`${row.rank}-${row.team}`}
              row={row}
              accentColor={gradientColorForIndex(topRows.length - 1 - index, topRows.length, '#2E86DE', '#27AE60')}
              highlight={index === 0}
              danger={false}
              isEnglish={isEnglish}
            />
          ))}
        </div>

        {bottomRows.length > 0 ? (
          <HiddenStandingsGap
            accentColor={accentColor}
          />
        ) : null}

        {bottomRows.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 24,
            overflow: 'hidden',
            border: '2px solid rgba(231,76,60,0.72)',
            boxShadow: '0 0 26px rgba(240,165,0,0.24), 0 0 26px rgba(231,76,60,0.24)',
            background: 'rgba(18,12,8,0.72)',
          }}
        >
          <div
            style={{
              padding: '10px 18px 7px',
              color: '#F0A500',
              fontSize: 26,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: 5,
              textAlign: 'center',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(240,165,0,0.45)',
            }}
          >
            ⚠ {isEnglish ? 'Risk Zone' : 'Faixa de Risco'} ⚠
          </div>
          {bottomRows.map((row, index) => (
            <StandingsTeaserRow
              key={`${row.rank}-${row.team}`}
              row={row}
              accentColor={gradientColorForIndex(index, bottomRows.length, '#F0A500', '#E74C3C')}
              highlight={false}
              danger
              isEnglish={isEnglish}
            />
          ))}
        </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 150,
          right: 150,
          bottom: 38,
          padding: '18px 26px 14px',
          borderRadius: 18,
          border: `1px solid ${accentColor}aa`,
          background: 'rgba(15,19,24,0.88)',
          color: '#f0f4f8',
          fontSize: 30,
          lineHeight: 1.1,
          fontWeight: 900,
          fontStyle: 'italic',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        <span style={{color: accentColor}}>{isEnglish ? 'Every point matters' : 'Cada ponto faz a diferença!'}</span>
      </div>
    </div>
  );
};

const StandingsHeaderRow = ({accentColor, isEnglish}: {accentColor: string; isEnglish: boolean}) => (
  <div
    style={{
      minHeight: 52,
      display: 'grid',
      gridTemplateColumns: '72px 78px minmax(0, 1fr) 132px 170px',
      alignItems: 'center',
      gap: 12,
      padding: '0 18px',
      color: '#f0f4f8',
      fontSize: 22,
      lineHeight: 1,
      fontWeight: 900,
      letterSpacing: 2,
      textTransform: 'uppercase',
      borderBottom: `1px solid ${accentColor}88`,
      background: 'rgba(15,19,24,0.88)',
    }}
  >
    <div />
    <div />
    <div />
    <div style={{textAlign: 'center'}}>{isEnglish ? 'Pts' : 'Pontos'}</div>
    <div style={{textAlign: 'center'}}>{isEnglish ? 'Form' : 'Últimos'}</div>
  </div>
);

const HiddenStandingsGap = ({
  accentColor,
}: {
  accentColor: string;
}) => (
  <div
    style={{
      height: 54,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 18,
      padding: '0 42px',
      color: '#c0ccd8',
      background:
        `linear-gradient(90deg, rgba(46,134,222,0.08), ${accentColor}12 48%, rgba(240,165,0,0.10))`,
      borderRadius: 16,
      border: '1px solid rgba(240,244,248,0.16)',
    }}
  >
    <div
      style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accentColor}88)`,
      }}
    />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 8px)',
        gap: 12,
        justifyContent: 'center',
        color: '#f0f4f8',
      }}
    >
      {Array.from({length: 5}).map((_, index) => (
        <div
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: index < 2 ? accentColor : index === 2 ? '#c0ccd8' : '#F0A500',
            boxShadow: `0 0 10px ${index < 2 ? accentColor : index === 2 ? '#c0ccd8' : '#F0A500'}88`,
          }}
        />
      ))}
    </div>
    <div
      style={{
        height: 2,
        background: 'linear-gradient(90deg, #F0A50088, transparent)',
      }}
    />
  </div>
);

const StandingsTeaserRow = ({
  row,
  accentColor,
  highlight,
  danger,
  isEnglish,
}: {
  row: StandingRow | WorldCupGroupRow;
  accentColor: string;
  highlight: boolean;
  danger: boolean;
  isEnglish: boolean;
}) => {
  const form = standingForm(row);
  const teamFontSize = fitStandingsTeaserTeamFontSize(
    row.team,
    highlight ? 46 : danger ? 36 : 40,
    390
  );
  return (
    <div
      style={{
        minHeight: highlight ? 142 : danger ? 94 : 106,
        display: 'grid',
        gridTemplateColumns: '72px 78px minmax(0, 1fr) 132px 170px',
        alignItems: 'center',
        gap: 12,
        padding: '0 18px',
        borderBottom: '1px solid rgba(240,244,248,0.13)',
        background: highlight
          ? `linear-gradient(90deg, ${accentColor}24, rgba(15,19,24,0.92))`
          : danger
            ? `linear-gradient(90deg, ${accentColor}26, rgba(20,8,8,0.62) 58%, rgba(15,19,24,0.72))`
            : 'rgba(15,19,24,0.72)',
      }}
    >
      <div
        style={{
          color: highlight || danger ? accentColor : '#c0ccd8',
          fontSize: highlight ? 78 : danger ? 48 : 56,
          lineHeight: 0.9,
          fontWeight: 900,
          fontStyle: 'italic',
          textAlign: 'center',
          textShadow: highlight ? `0 0 18px ${accentColor}66` : undefined,
        }}
      >
        {row.rank}
      </div>
      <MiniBadge badge={row.badge} label={row.team} size={highlight ? 72 : 62} />
      <div
        style={{
          minWidth: 0,
          color: '#f0f4f8',
          fontSize: teamFontSize,
          lineHeight: 0.9,
          fontWeight: 900,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          textShadow: highlight ? '0 6px 18px rgba(0,0,0,0.68)' : undefined,
        }}
      >
        {row.team}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <span
          style={{
            color: highlight || danger ? accentColor : '#f0f4f8',
            fontSize: highlight ? 74 : danger ? 48 : 54,
            lineHeight: 0.78,
            fontWeight: 900,
          }}
        >
          {standingPoints(row)}
        </span>
        <span
          style={{
            color: highlight || danger ? accentColor : '#c0ccd8',
            fontSize: 24,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          PTS
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: highlight ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: highlight ? 10 : 9,
          minWidth: 0,
        }}
      >
        {highlight ? (
          <div
            style={{
              padding: '7px 14px 5px',
              transform: 'skewX(-12deg)',
              background: accentColor,
              color: '#0b0d12',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: 'uppercase',
              boxShadow: `0 0 18px ${accentColor}55`,
            }}
          >
            <span style={{display: 'block', transform: 'skewX(12deg)'}}>{isEnglish ? 'Leader' : 'Líder'}</span>
          </div>
        ) : null}
        {form.length ? (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9}}>
            {form.map((result, index) => (
              <div
                key={`${row.rank}-${index}-${result}`}
                style={{
                  width: highlight ? 23 : 19,
                  height: highlight ? 23 : 19,
                  borderRadius: 999,
                  background: formDotColor(result),
                  boxShadow: highlight ? `0 0 12px ${formDotColor(result)}88` : undefined,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const paceColor = (percentage: number, benchmark: number) => {
  if (percentage >= benchmark) return '#C8FF1A';
  if (percentage >= benchmark - 10) return '#8FEA2A';
  if (percentage >= benchmark - 17) return '#F0A500';
  return '#E74C3C';
};

const pacePositions = [
  {right: 72, top: 238, align: 'right' as const, size: 100},
  {left: 72, top: 690, align: 'left' as const, size: 94},
  {right: 78, top: 712, align: 'right' as const, size: 88},
  {left: 72, top: 1320, align: 'left' as const, size: 86},
  {right: 72, top: 1348, align: 'right' as const, size: 84},
  {left: 166, bottom: 150, align: 'left' as const, size: 78},
  {right: 170, bottom: 124, align: 'right' as const, size: 76},
  {left: 68, top: 1116, align: 'left' as const, size: 82},
];

const relegationPositions = [
  {left: 68, top: 520, align: 'left' as const, size: 96},
  {right: 68, top: 552, align: 'right' as const, size: 92},
  {left: 72, top: 780, align: 'left' as const, size: 86},
  {right: 72, top: 812, align: 'right' as const, size: 84},
  {left: 70, top: 1050, align: 'left' as const, size: 82},
  {right: 70, top: 1082, align: 'right' as const, size: 80},
  {left: 72, top: 1308, align: 'left' as const, size: 78},
  {right: 72, top: 1338, align: 'right' as const, size: 76},
  {left: 150, bottom: 128, align: 'left' as const, size: 74},
  {right: 150, bottom: 122, align: 'right' as const, size: 74},
];

const relegationColor = (percentage: number, benchmark: number) => {
  if (percentage < benchmark - 10) return '#FF1F1F';
  if (percentage < benchmark) return '#FF5A2D';
  if (percentage <= benchmark + 4) return '#F0A500';
  return '#C0CCD8';
};

const relegationAboveLinePositions = [
  {left: 58, top: 512, align: 'left' as const},
  {left: 390, top: 546, align: 'center' as const},
  {left: 722, top: 504, align: 'right' as const},
  {left: 78, top: 672, align: 'left' as const},
  {left: 390, top: 714, align: 'center' as const},
  {left: 710, top: 682, align: 'right' as const},
];

const relegationBelowLinePositions = [
  {left: 58, top: 1164, align: 'left' as const},
  {left: 390, top: 1208, align: 'center' as const},
  {left: 722, top: 1172, align: 'right' as const},
  {left: 390, top: 1388, align: 'center' as const},
];

const RelegationThreatCard = ({
  entry,
  color,
  align,
}: {
  entry: PaceEntry;
  color: string;
  align: 'left' | 'center' | 'right';
}) => (
  <div
    style={{
      width: 300,
      minHeight: 120,
      textAlign: align,
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        gap: 12,
      }}
    >
      <RelegationThreatLogo entry={entry} />
      <div
        style={{
          ...TEASER_NUMBER_EFFECT,
          color,
          fontSize: entry.percentage < 30 ? 82 : 76,
          lineHeight: 0.76,
          fontWeight: 900,
          fontStyle: 'italic',
          textShadow: `0 0 30px ${color}8f, 0 12px 28px rgba(0,0,0,0.82)`,
        }}
      >
        {entry.percentage}%
      </div>
    </div>
  </div>
);

const RelegationThreatLogo = ({entry}: {entry: PaceEntry}) => {
  const src = badgeSrc(entry.badge);

  if (!src) {
    return (
      <div
        style={{
          marginTop: 10,
          color: '#f0f4f8',
          fontSize: entry.team.length > 13 ? 23 : 28,
          lineHeight: 0.9,
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(231,76,60,0.9), 0 8px 22px rgba(0,0,0,0.9)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {entry.team}
      </div>
    );
  }

  return (
    <Img
      src={src}
      style={{
        flex: '0 0 auto',
        width: 92,
        height: 92,
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 18px rgba(231,76,60,0.95)) drop-shadow(0 10px 18px rgba(0,0,0,0.82))',
      }}
    />
  );
};

const ChampionshipPaceTeaserPoster = ({
  entries,
  leagueName,
  subtitleLabel,
  benchmarkPercentage,
  benchmarkLabel,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  entries: PaceEntry[];
  leagueName: string;
  subtitleLabel?: string;
  benchmarkPercentage?: number;
  benchmarkLabel?: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const sorted = [...entries].sort((left, right) => right.percentage - left.percentage || left.rank - right.rank);
  const leader = sorted[0];
  const benchmark = benchmarkPercentage ?? 68;
  const sideEntries = sorted.slice(1, 9);
  const accentRgb = hexToRgb(accentColor);
  const accentRgba = (opacity: number) => `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${opacity})`;
  const trophyImagePath = staticFile('backgrounds/championship-pace-trophy.png');
  const backgroundPercentages = sorted.length
    ? sorted.map((entry) => `${entry.percentage}%`)
    : ['48%', '51%', '54%', '57%', '62%', '68%', '76%', '82%'];

  if (!leader) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background:
          `radial-gradient(circle at 50% 56%, ${accentColor}36, transparent 34%), ` +
          `radial-gradient(circle at 50% 18%, ${accentRgba(0.18)}, transparent 28%), #040704`,
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={accentColor} intensity={1.08} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 50% 60%, ${accentRgba(0.24)}, transparent 25%), linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0.06) 42%, rgba(0,0,0,0.78))`,
        }}
      />
      {Array.from({length: 32}).map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${(index * 37) % 100}%`,
            top: `${(index * 53) % 100}%`,
            color: index % 3 === 0 ? accentColor : 'rgba(240,244,248,0.18)',
            fontSize: 36 + (index % 4) * 12,
            fontWeight: 900,
            opacity: 0.18,
            transform: `rotate(${index * 17}deg)`,
          }}
        >
          {backgroundPercentages[index % backgroundPercentages.length]}
        </div>
      ))}

      {brandName ? (
        <div style={{position: 'absolute', top: 62, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 332,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: '#f0f4f8',
            fontSize: 154,
            lineHeight: 0.78,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: '0 14px 36px rgba(0,0,0,0.82)',
          }}
        >
          {isEnglish ? 'TITLE' : 'RITMO'}
        </div>
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: accentColor,
            fontSize: 104,
            lineHeight: 0.86,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: `0 0 32px ${accentRgba(0.72)}, 0 14px 36px rgba(0,0,0,0.82)`,
          }}
        >
          {isEnglish ? 'PACE' : 'DE CAMPEÃO'}
        </div>
        <div
          style={{
            margin: '24px auto 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 28px 9px',
            borderRadius: 10,
            border: `1px solid ${accentColor}aa`,
            color: '#f0f4f8',
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            background: 'rgba(5,8,6,0.72)',
          }}
        >
          <span style={{color: accentColor}}>★</span>
          <span>{subtitleLabel || leagueName}</span>
          <span style={{color: accentColor}}>★</span>
        </div>
        <div
          style={{
            margin: '16px auto 0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            padding: '8px 22px 7px',
            borderRadius: 8,
            background: 'rgba(5,8,6,0.66)',
            boxShadow: `0 0 34px ${accentRgba(0.26)}`,
          }}
        >
          <span
            style={{
              ...TEASER_NUMBER_EFFECT,
              color: accentColor,
              fontSize: 60,
              lineHeight: 0.82,
              fontWeight: 900,
              fontStyle: 'italic',
              textShadow: `0 0 24px ${accentRgba(0.58)}`,
            }}
          >
            {benchmark}%
          </span>
          <span
            style={{
              color: '#f0f4f8',
              fontSize: 23,
              lineHeight: 0.92,
              maxWidth: 270,
              fontWeight: 900,
              fontStyle: 'italic',
              textAlign: 'left',
              textTransform: 'uppercase',
            }}
          >
            {benchmarkLabel || (isEnglish ? 'Last champions average' : 'Média dos campeões')}
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 760,
          width: 680,
          height: 930,
          transform: 'translateX(-50%)',
          opacity: 0.9,
          filter: `drop-shadow(0 0 64px ${accentColor}88) drop-shadow(0 26px 46px rgba(0,0,0,0.64))`,
        }}
      >
        <Img
          src={trophyImagePath}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'saturate(0.45) contrast(1.18) brightness(1.02)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              `linear-gradient(135deg, ${accentRgba(0.08)} 0%, ${accentRgba(0.55)} 46%, ${accentRgba(
                0.2,
              )} 100%)`,
            WebkitMaskImage: `url(${trophyImagePath})`,
            maskImage: `url(${trophyImagePath})`,
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            mixBlendMode: 'color',
            opacity: 0.76,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 48% 38%, ${accentRgba(0.34)}, transparent 34%)`,
            WebkitMaskImage: `url(${trophyImagePath})`,
            maskImage: `url(${trophyImagePath})`,
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            mixBlendMode: 'screen',
            opacity: 0.54,
          }}
        />
      </div>

      {sideEntries.map((entry, index) => (
        <PaceFloatingStat
          key={`${entry.rank}-${entry.team}`}
          entry={entry}
          position={pacePositions[index] ?? pacePositions[pacePositions.length - 1]}
          color={paceColor(entry.percentage, benchmark)}
          emphasize={index === 0}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 238,
          width: 270,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            ...TEASER_NUMBER_EFFECT,
            color: paceColor(leader.percentage, benchmark),
            fontSize: 122,
            lineHeight: 0.78,
            fontWeight: 900,
            fontStyle: 'italic',
            textShadow: `0 0 34px ${paceColor(leader.percentage, benchmark)}88`,
          }}
        >
          {leader.percentage}%
        </div>
        <div
          style={{
            color: '#f0f4f8',
            fontSize: 36,
            lineHeight: 0.95,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
          }}
        >
          {leader.team}
        </div>
      </div>
    </div>
  );
};

const RelegationLineTeaserPoster = ({
  entries,
  leagueName,
  subtitleLabel,
  benchmarkPercentage,
  benchmarkLabel,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
}: {
  entries: PaceEntry[];
  leagueName: string;
  subtitleLabel?: string;
  benchmarkPercentage?: number;
  benchmarkLabel?: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
}) => {
  const sorted = [...entries].sort((left, right) => left.percentage - right.percentage || right.rank - left.rank);
  const benchmark = benchmarkPercentage ?? 38;
  const aboveLineEntries = [...entries]
    .filter((entry) => entry.percentage >= benchmark)
    .sort((left, right) => right.percentage - left.percentage || left.rank - right.rank)
    .slice(0, relegationAboveLinePositions.length);
  const belowLineEntries = [...entries]
    .filter((entry) => entry.percentage < benchmark)
    .sort((left, right) => right.percentage - left.percentage || left.rank - right.rank)
    .slice(0, relegationBelowLinePositions.length);
  const dangerColor = '#E74C3C';
  const accentRgb = hexToRgb(accentColor);
  const accentRgba = (opacity: number) => `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${opacity})`;
  const dangerPercentages = sorted.length
    ? sorted.map((entry) => `${entry.percentage}%`)
    : ['25%', '29%', '33%', '37%', '38%', '41%', '44%', '47%'];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background:
          `radial-gradient(circle at 50% 70%, rgba(231,76,60,0.36), transparent 34%), ` +
          'linear-gradient(180deg, #020303 0%, #050202 48%, #130303 100%)',
      }}
    >
      <Img
        src={staticFile('backgrounds/relegation-line-abyss.png')}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -18,
          width: 1080,
          height: 1620,
          transform: 'translateX(-50%)',
          objectFit: 'cover',
          opacity: 0.94,
          filter: 'contrast(1.12) saturate(1.12) brightness(0.88)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      {Array.from({length: 30}).map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${(index * 41) % 100}%`,
            top: `${(index * 59) % 100}%`,
            color: index % 3 === 0 ? dangerColor : 'rgba(240,244,248,0.16)',
            fontSize: 34 + (index % 4) * 11,
            fontWeight: 900,
            opacity: 0.16,
            transform: `rotate(${index * -19}deg)`,
          }}
        >
          {dangerPercentages[index % dangerPercentages.length]}
        </div>
      ))}

      {brandName ? (
        <div style={{position: 'absolute', top: 62, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 176,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: '#f0f4f8',
            fontSize: 74,
            lineHeight: 0.82,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: '0 14px 36px rgba(0,0,0,0.88)',
          }}
        >
          {isEnglish ? 'DANGER' : 'LINHA DO'}
        </div>
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: dangerColor,
            fontSize: 82,
            lineHeight: 0.84,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: '0 0 34px rgba(231,76,60,0.78), 0 14px 36px rgba(0,0,0,0.88)',
          }}
        >
          {isEnglish ? 'ZONE' : 'REBAIXAMENTO'}
        </div>
        <div
          style={{
            margin: '18px auto 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 24px 8px',
            borderRadius: 10,
            border: '1px solid rgba(231,76,60,0.72)',
            color: '#f0f4f8',
            fontSize: 26,
            lineHeight: 1,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            background: 'rgba(12,3,3,0.72)',
          }}
        >
          <span style={{color: dangerColor}}>▼</span>
          <span>{subtitleLabel || leagueName}</span>
          <span style={{color: dangerColor}}>▼</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 930,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            ...TEASER_NUMBER_EFFECT,
            color: '#f0f4f8',
            fontSize: 148,
            lineHeight: 0.72,
            fontWeight: 900,
            fontStyle: 'italic',
            textShadow: '0 0 34px rgba(240,244,248,0.46), 0 24px 54px rgba(0,0,0,0.92)',
          }}
        >
          {benchmark}%
        </div>
        <div
          style={{
            margin: '18px auto 0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
            width: 920,
          }}
        >
          <span style={{height: 5, flex: 1, background: `linear-gradient(90deg, transparent, ${dangerColor})`}} />
          <span
            style={{
              color: '#f0f4f8',
              fontSize: 34,
              lineHeight: 0.9,
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: 0,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              textShadow: '0 0 24px rgba(231,76,60,0.62), 0 10px 26px rgba(0,0,0,0.88)',
            }}
          >
            {benchmarkLabel || (isEnglish ? 'Safety line' : 'Linha de segurança')}
          </span>
          <span style={{height: 5, flex: 1, background: `linear-gradient(90deg, ${dangerColor}, transparent)`}} />
        </div>
      </div>

      {aboveLineEntries.map((entry, index) => {
        const position = relegationAboveLinePositions[index] ?? relegationAboveLinePositions[relegationAboveLinePositions.length - 1];
        return (
          <div key={`above-${entry.rank}-${entry.team}`} style={{position: 'absolute', ...position}}>
            <RelegationThreatCard entry={entry} color={relegationColor(entry.percentage, benchmark)} align={position.align} />
          </div>
        );
      })}
      {belowLineEntries.map((entry, index) => {
        const position = relegationBelowLinePositions[index] ?? relegationBelowLinePositions[relegationBelowLinePositions.length - 1];
        return (
          <div key={`below-${entry.rank}-${entry.team}`} style={{position: 'absolute', ...position}}>
            <RelegationThreatCard entry={entry} color={relegationColor(entry.percentage, benchmark)} align={position.align} />
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 72,
          textAlign: 'center',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          fontWeight: 900,
          lineHeight: 0.96,
          textShadow: '0 10px 30px rgba(0,0,0,0.92)',
        }}
      >
        <div style={{color: '#f0f4f8', fontSize: 52}}>{isEnglish ? 'The drop is real.' : 'A queda é real.'}</div>
        <div style={{marginTop: 12, color: dangerColor, fontSize: 58}}>
          {isEnglish ? 'The fight too.' : 'A disputa também.'}
        </div>
      </div>
    </div>
  );
};

const ChampionFinalTeaserPoster = ({
  championTeam,
  championBadge,
  finalFixture,
  leagueName,
  seasonLabel,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  championTeam?: string;
  championBadge?: TeamBadge;
  finalFixture?: FixtureCard;
  leagueName: string;
  seasonLabel?: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const badgeImage = badgeSrc(championBadge);
  const championName = championTeam || finalFixture?.homeTeam || finalFixture?.awayTeam || (isEnglish ? 'Champion' : 'Campeão');
  const accentRgb = hexToRgb(accentColor);
  const glow = (opacity: number) => `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${opacity})`;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#030405',
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={accentColor} intensity={1.18} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 50% 56%, ${glow(0.38)}, transparent 34%), ` +
            'radial-gradient(circle at 50% 82%, rgba(0,0,0,0.1), rgba(0,0,0,0.74) 46%), ' +
            'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 34%, rgba(0,0,0,0.82))',
        }}
      />
      {Array.from({length: 34}).map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${(index * 31 + 8) % 100}%`,
            top: `${(index * 47 + 4) % 100}%`,
            width: 18 + (index % 3) * 10,
            height: 8 + (index % 4) * 5,
            borderRadius: 3,
            background: index % 4 === 0 ? '#f0f4f8' : accentColor,
            opacity: 0.12 + (index % 4) * 0.05,
            transform: `rotate(${index * 23}deg) skewX(-10deg)`,
            boxShadow: `0 0 18px ${glow(0.42)}`,
          }}
        />
      ))}

      {brandName ? (
        <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 146,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            padding: '12px 34px 9px',
            borderRadius: 12,
            color: '#080a0d',
            background: accentColor,
            fontFamily: TEASER_LABEL_FONT,
            fontSize: leagueName.length > 24 ? 28 : 34,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: 'uppercase',
            boxShadow: `0 0 34px ${glow(0.64)}`,
            clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)',
          }}
        >
          {leagueName}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 226,
          left: 42,
          right: 42,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            color: accentColor,
            fontSize: isEnglish ? 156 : 166,
            lineHeight: 0.82,
            fontWeight: 900,
            textTransform: 'uppercase',
            textShadow: `0 0 38px ${glow(0.82)}, 0 16px 42px rgba(0,0,0,0.86)`,
          }}
        >
          {isEnglish ? 'CHAMPION!' : 'CAMPEÃO!'}
        </div>
        <div
          style={{
            marginTop: 18,
            color: '#f0f4f8',
            fontFamily: TEASER_LABEL_FONT,
            fontSize: isEnglish ? 40 : 42,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 5,
            textTransform: 'uppercase',
            textShadow: '0 10px 26px rgba(0,0,0,0.82)',
          }}
        >
          {isEnglish ? 'The title is theirs' : 'O título é dele'}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 585,
          width: 930,
          height: 930,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-28px -42px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 50% 48%, ${glow(0.72)}, ${glow(0.22)} 34%, transparent 62%)`,
            filter: 'blur(12px)',
          }}
        />
        <Img
          src={staticFile('backgrounds/champion-final-shield-trophy.png')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.7,
            filter:
              `saturate(1.18) contrast(1.12) sepia(0.28) drop-shadow(0 0 58px ${glow(0.72)}) drop-shadow(0 30px 44px rgba(0,0,0,0.82))`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 344,
            width: 312,
            height: 312,
            transform: 'translateX(-68%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow(0.34)}, rgba(0,0,0,0.08) 62%, transparent 72%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 46px ${glow(0.62)}`,
          }}
        >
          {badgeImage ? (
            <Img
              src={badgeImage}
              style={{
                width: 250,
                height: 250,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 22px rgba(255,255,255,0.42)) drop-shadow(0 16px 20px rgba(0,0,0,0.74))',
              }}
            />
          ) : (
            <div style={{fontSize: 116, fontWeight: 900, color: accentColor}}>★</div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          bottom: 262,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            minWidth: 640,
            maxWidth: 880,
            padding: '22px 46px 18px',
            borderRadius: 18,
            border: `2px solid ${accentColor}`,
            background: 'linear-gradient(180deg, rgba(6,8,10,0.9), rgba(16,18,20,0.72))',
            boxShadow: `0 0 34px ${glow(0.52)}, inset 0 0 22px rgba(255,255,255,0.07)`,
            color: '#f8fbff',
            fontFamily: TEASER_HEADLINE_FONT,
            fontSize: championName.length > 18 ? 52 : 64,
            lineHeight: 0.96,
            fontWeight: 900,
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: '0 10px 28px rgba(0,0,0,0.86)',
          }}
        >
          {championName}
        </div>
      </div>

      {brandName ? (
        <div style={{position: 'absolute', bottom: 74, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}
    </div>
  );
};

const TierlistTeaserPoster = ({
  tiers,
  leagueName,
  accentColor,
  isEnglish,
  brandName,
  brandLogoPath,
  backgroundPath,
}: {
  tiers: TierlistGroup[];
  leagueName: string;
  accentColor: string;
  isEnglish: boolean;
  brandName?: string;
  brandLogoPath?: string;
  backgroundPath: string;
}) => {
  const teams = tierlistPosterTeams(tiers).slice(0, 14);
  const questions = isEnglish
    ? ['Who becomes champion?', 'Who goes far?', 'Who surprises?']
    : ['Quem será campeão?', 'Quem vai longe?', 'Quem surpreende?'];
  const positions = [
    {left: 54, top: 850, size: 146, rotate: -7},
    {left: 330, top: 822, size: 136, rotate: 4},
    {right: 284, top: 832, size: 142, rotate: -3},
    {right: 64, top: 874, size: 144, rotate: 7},
    {left: 188, top: 1050, size: 128, rotate: -10},
    {left: 486, top: 1018, size: 140, rotate: 2},
    {right: 192, top: 1070, size: 132, rotate: -5},
    {left: 70, top: 1232, size: 142, rotate: 8},
    {left: 350, top: 1248, size: 132, rotate: -4},
    {right: 82, top: 1238, size: 140, rotate: 6},
    {left: 204, top: 1458, size: 128, rotate: 5},
    {left: 492, top: 1442, size: 136, rotate: -7},
    {right: 154, top: 1474, size: 126, rotate: 8},
    {left: 72, top: 1618, size: 118, rotate: -5},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#050605',
      }}
    >
      <TeaserBackdrop backgroundPath={backgroundPath} accentColor={accentColor} intensity={1.04} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(circle at 50% 20%, ${accentRgba(accentColor, 0.24)}, transparent 28%), ` +
            `radial-gradient(circle at 50% 72%, ${accentRgba(accentColor, 0.22)}, transparent 34%), ` +
            'linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.06) 44%, rgba(0,0,0,0.64))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.24,
          backgroundImage:
            'linear-gradient(135deg, transparent 0 45%, rgba(240,244,248,0.25) 45% 46%, transparent 46% 100%), radial-gradient(circle, rgba(240,244,248,0.28) 0 2px, transparent 2px)',
          backgroundSize: '170px 170px, 46px 46px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 70,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: accentColor,
            fontFamily: TEASER_LABEL_FONT,
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textShadow: `0 0 22px ${accentRgba(accentColor, 0.58)}`,
          }}
        >
          {leagueName}
        </div>
        <div
          style={{
            ...TEASER_HEADLINE_EFFECT,
            marginTop: 28,
            color: accentColor,
            fontSize: 168,
            lineHeight: 0.78,
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            textShadow: `0 0 36px ${accentRgba(accentColor, 0.72)}, 0 18px 34px rgba(0,0,0,0.88)`,
          }}
        >
          Tierlist
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          top: 356,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        {questions.map((question, index) => (
          <div
            key={question}
            style={{
              position: 'relative',
              alignSelf: index === 2 ? 'flex-end' : 'stretch',
              width: index === 2 ? '84%' : '100%',
              padding: index === 1 ? '18px 36px 14px' : '20px 38px 16px',
              border: `2px solid ${index === 1 ? accentColor : 'rgba(240,244,248,0.72)'}`,
              background: 'linear-gradient(90deg, rgba(5,8,6,0.78), rgba(20,28,36,0.52))',
              transform: `skewX(${index === 1 ? -5 : -3}deg)`,
              boxShadow: `0 0 22px ${accentRgba(accentColor, 0.28)}`,
            }}
          >
            <div
              style={{
                ...TEASER_HEADLINE_EFFECT,
                transform: `skewX(${index === 1 ? 5 : 3}deg)`,
                color: index === 0 ? '#f0f4f8' : accentColor,
                fontSize: index === 1 ? 72 : 64,
                lineHeight: 0.9,
                fontWeight: 900,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                textShadow: '0 12px 28px rgba(0,0,0,0.84)',
              }}
            >
              {question}
            </div>
          </div>
        ))}
      </div>

      {teams.map((team, index) => {
        const position = positions[index] ?? positions[positions.length - 1];
        const teamAccent = teamAccentColor(team.team, team.badge, accentColor);

        return (
          <div
            key={`${team.team}-${index}`}
            style={{
              position: 'absolute',
              ...position,
              width: position.size,
              height: position.size,
              transform: `rotate(${position.rotate}deg)`,
              filter: `drop-shadow(0 0 16px ${accentRgba(teamAccent, 0.72)}) drop-shadow(0 16px 26px rgba(0,0,0,0.78))`,
            }}
          >
            <MiniBadge badge={team.badge} label={team.team} size={position.size} />
          </div>
        );
      })}

      {[0, 1, 2, 3, 4].map((item) => (
        <div
          key={item}
          style={{
            position: 'absolute',
            left: [706, 238, 818, 512, 128][item],
            top: [960, 1262, 1446, 1650, 1740][item],
            color: accentColor,
            fontSize: [104, 80, 88, 64, 70][item],
            lineHeight: 1,
            fontWeight: 900,
            opacity: item === 4 ? 0.36 : 0.62,
            transform: `rotate(${[-8, 12, -10, 7, -12][item]}deg)`,
            textShadow: `0 0 22px ${accentRgba(accentColor, 0.64)}`,
          }}
        >
          ?
        </div>
      ))}

      {brandName ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center'}}>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
      ) : null}
    </div>
  );
};

const PaceFloatingStat = ({
  entry,
  position,
  color,
  emphasize,
}: {
  entry: PaceEntry;
  position: {left?: number; right?: number; top?: number; bottom?: number; align: 'left' | 'right'; size: number};
  color: string;
  emphasize: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      ...position,
      width: emphasize ? 250 : 220,
      textAlign: position.align,
      transform: emphasize ? 'rotate(-4deg)' : position.align === 'left' ? 'rotate(-3deg)' : 'rotate(3deg)',
    }}
  >
    <div
      style={{
        ...TEASER_NUMBER_EFFECT,
        color,
        fontSize: position.size,
        lineHeight: 0.76,
        fontWeight: 900,
        fontStyle: 'italic',
        textShadow: `0 0 28px ${color}88, 0 10px 28px rgba(0,0,0,0.72)`,
      }}
    >
      {entry.percentage}%
    </div>
    <div
      style={{
        marginTop: 12,
        color: '#f0f4f8',
        fontSize: emphasize ? 34 : 28,
        lineHeight: 0.95,
        fontWeight: 900,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        textShadow: '0 8px 20px rgba(0,0,0,0.72)',
      }}
    >
      {entry.team}
    </div>
  </div>
);

const PosterTeam = ({children, align = 'left'}: {children: React.ReactNode; align?: 'left' | 'right'}) => {
  const label = String(children ?? '').replace(/\s+/g, ' ').trim();
  const fontSize =
    label.length > 24
      ? 18
      : label.length > 21
        ? 20
        : label.length > 18
          ? 22
          : label.length > 15
            ? 25
            : label.length > 12
              ? 29
              : label.length > 9
                ? 34
                : 40;

  return (
    <div
      style={{
        color: '#f0f4f8',
        fontSize,
        lineHeight: 0.92,
        fontWeight: 900,
        textAlign: align,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        textShadow: '0 8px 18px rgba(0,0,0,0.88), 0 0 14px rgba(240,244,248,0.18)',
        width: '100%',
        minWidth: 0,
      }}
    >
      {label}
    </div>
  );
};

const PosterRankRows = ({
  items,
  accentColor,
}: {
  items: Array<{rank: string | number; name: string; stat: string; badge?: TeamBadge}>;
  accentColor: string;
}) => (
  <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 14}}>
    {items.slice(0, 5).map((item) => (
      <div
        key={`${item.rank}-${item.name}`}
        style={{
          minHeight: 118,
          display: 'grid',
          gridTemplateColumns: '64px 96px 1fr 150px',
          alignItems: 'center',
          gap: 18,
          padding: '14px 22px',
          borderRadius: 16,
          background: 'linear-gradient(90deg, rgba(15,19,24,0.9), rgba(20,28,36,0.68))',
          border: `1px solid ${accentColor}55`,
        }}
      >
        <div style={{color: accentColor, fontSize: 46, fontWeight: 900, textAlign: 'center'}}>{item.rank}</div>
        <MiniBadge badge={item.badge} label={item.name} size={82} />
        <div
          style={{
            color: '#f0f4f8',
            fontSize: 42,
            lineHeight: 0.92,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            color: accentColor,
            fontSize: 42,
            lineHeight: 1,
            fontWeight: 900,
            textAlign: 'right',
            textTransform: 'uppercase',
          }}
        >
          {item.stat}
        </div>
      </div>
    ))}
  </div>
);

const StatHero = ({
  kicker,
  title,
  stat,
  badge,
  accentColor,
}: {
  kicker: string;
  title: string;
  stat?: string;
  badge?: TeamBadge;
  accentColor: string;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: badge ? '220px 1fr' : '1fr',
      gap: 34,
      alignItems: 'center',
      width: '100%',
    }}
  >
    {badge ? <MiniBadge badge={badge} label={title} size={186} /> : null}
    <div>
      <div style={{color: accentColor, fontSize: 42, fontWeight: 900, textTransform: 'uppercase'}}>{kicker}</div>
      <div
        style={{
          marginTop: 10,
          color: '#f0f4f8',
          fontSize: title.length > 22 ? 80 : 104,
          lineHeight: 0.86,
          fontWeight: 900,
          textTransform: 'uppercase',
          textWrap: 'balance',
        }}
      >
        {title}
      </div>
      {stat ? (
        <div
          style={{
            marginTop: 22,
            display: 'inline-flex',
            padding: '12px 20px 10px',
            background: accentColor,
            color: '#0b0d12',
            fontSize: 42,
            lineHeight: 1,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {stat}
        </div>
      ) : null}
    </div>
  </div>
);

const buildFixtureList = (fixtures?: FixtureCard[], mode: 'score' | 'fixture' | 'prediction' = 'fixture') =>
  (fixtures ?? []).slice(0, 4).map((fixture) => {
    const teams = fixtureTeams(fixture);
    if (mode === 'score' && hasScore(fixture)) return `${shortTeam(teams.home)} ${fixtureScore(fixture)} ${shortTeam(teams.away)}`;
    return `${shortTeam(teams.home)} x ${shortTeam(teams.away)}`;
  });

export const FootballShortTeaser = ({
  template,
  variant,
  channelProfile = 'pt',
  leagueName,
  roundLabel,
  titleLabel,
  subtitleLabel,
  phaseLabel,
  groupLabel,
  seasonLabel,
  accentColor,
  secondaryAccentColor,
  fixtures,
  rows,
  entries,
  championTeam,
  championBadge,
  finalFixture,
  qualificationGroups,
  relegationGroup,
  groups,
  tiers,
  topScorerPrediction,
  bestPlayerPrediction,
  nextMatches,
  lastResults,
  matches,
  brandName,
  brandLogoPath,
  benchmarkPercentage,
  benchmarkLabel,
}: FootballShortTeaserProps) => {
  const frame = useCurrentFrame();
  const isEnglish = channelProfile === 'en';
  const scene = frame < 30 ? 0 : frame < 60 ? 1 : 2;
  const accentFill = secondaryAccentColor
    ? `linear-gradient(90deg, ${accentColor}, ${secondaryAccentColor})`
    : accentColor;
  const label = pickTemplateLabel({template, variant, isEnglish});
  const isFixtureTeaser =
    (variant === 'results' || variant === 'next-games' || variant === 'predictions') &&
    Boolean(fixtures?.length);
  const isTopScorersTeaser = template === 'top-scorers' && Boolean(entries?.length);
  const isStandingsTeaser =
    (template === 'standings' || template === 'world-cup-group-standings') && Boolean(rows?.length);
  const isChampionshipPaceTeaser =
    template === 'championship-pace' && variant === 'championship' && Boolean(entries?.length);
  const isRelegationLineTeaser =
    template === 'relegation-line' && variant === 'relegation' && Boolean(entries?.length);
  const isChampionFinalTeaser =
    template === 'champion-final' && Boolean(championTeam || championBadge || finalFixture);
  const isTierlistTeaser = template === 'tierlist' && Boolean(tiers?.flatMap((tier) => tier.entries).length);
  const isStaticPosterTeaser =
    isFixtureTeaser ||
    isTopScorersTeaser ||
    isStandingsTeaser ||
    isChampionshipPaceTeaser ||
    isRelegationLineTeaser ||
    isChampionFinalTeaser ||
    isTierlistTeaser;
  const fixture = finalFixture ?? fixtures?.[0] ?? lastResults?.[0] ?? matches?.[0];
  const leader = rows?.[0] as StandingRow | WorldCupGroupRow | undefined;
  const entryLeader = entries?.[0] as TopScorerEntry | PlayerOfRoundEntry | PaceEntry | undefined;
  const tierPick = firstTierEntry(tiers);
  const groupRows = groups?.[0]?.rows ?? [];
  const nextFixture = nextMatches?.[0];
  const title =
    titleLabel ||
    phaseLabel ||
    groupLabel ||
    roundLabel ||
    subtitleLabel ||
    (isEnglish ? 'Football Update' : 'Atualização');
  const fixtureItems =
    variant === 'results'
      ? buildFixtureList(fixtures, 'score')
      : variant === 'predictions'
        ? buildFixtureList(fixtures, 'prediction')
        : buildFixtureList(fixtures, 'fixture');
  const availableItemCount =
    fixtures?.length ??
    rows?.length ??
    entries?.length ??
    groups?.flatMap((group) => group.rows).length ??
    tiers?.flatMap((tier) => tier.entries).length ??
    nextMatches?.length ??
    lastResults?.length ??
    matches?.length ??
    0;
  const moreCount = Math.max(0, availableItemCount - 1);
  const metaLabel = roundLabel || subtitleLabel || phaseLabel || groupLabel || seasonLabel;
  const teaserBackgroundPath = pickFootballShortBackground(template, variant);

  const teamsForStrip: HeroTeam[] = [
    ...(fixtures ?? []).flatMap((item) => [
      {name: item.homeTeam, badge: item.homeBadge},
      {name: item.awayTeam, badge: item.awayBadge},
    ]),
    ...(rows ?? []).map((row) => ({name: getRankName(row), badge: 'badge' in row ? row.badge : undefined})),
    ...(entries ?? []).map((entry) => ({name: getPlayerName(entry), badge: getEntryBadge(entry)})),
    ...(nextMatches ?? []).flatMap((item) => [
      {name: item.homeTeam, badge: item.homeBadge},
      {name: item.awayTeam, badge: item.awayBadge},
    ]),
  ].filter((team) => team.name);

  const renderScene = () => {
    if (isFixtureTeaser && fixtures?.length) {
      return (
        <FixtureTeaserPoster
          fixtures={fixtures}
          accentColor={accentColor}
          mode={variant === 'results' ? 'score' : variant === 'predictions' ? 'prediction' : 'fixture'}
          leagueName={leagueName}
          label={label}
          metaLabel={metaLabel}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (isTopScorersTeaser && entries?.length) {
      return (
        <TopScorersTeaserPoster
          entries={entries as TopScorerEntry[]}
          leagueName={leagueName}
          titleLabel={titleLabel || label}
          subtitleLabel={subtitleLabel}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (isStandingsTeaser && rows?.length) {
      return (
        <StandingsTeaserPoster
          rows={rows}
          leagueName={leagueName}
          metaLabel={metaLabel}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (isChampionshipPaceTeaser && entries?.length) {
      return (
        <ChampionshipPaceTeaserPoster
          entries={entries as PaceEntry[]}
          leagueName={leagueName}
          subtitleLabel={subtitleLabel}
          benchmarkPercentage={benchmarkPercentage}
          benchmarkLabel={benchmarkLabel}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (isRelegationLineTeaser && entries?.length) {
      return (
        <RelegationLineTeaserPoster
          entries={entries as PaceEntry[]}
          leagueName={leagueName}
          subtitleLabel={subtitleLabel}
          benchmarkPercentage={benchmarkPercentage}
          benchmarkLabel={benchmarkLabel}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
        />
      );
    }

    if (isChampionFinalTeaser) {
      return (
        <ChampionFinalTeaserPoster
          championTeam={championTeam}
          championBadge={championBadge}
          finalFixture={finalFixture}
          leagueName={leagueName}
          seasonLabel={seasonLabel}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (isTierlistTeaser && tiers?.length) {
      return (
        <TierlistTeaserPoster
          tiers={tiers}
          leagueName={leagueName}
          accentColor={accentColor}
          isEnglish={isEnglish}
          brandName={brandName}
          brandLogoPath={brandLogoPath}
          backgroundPath={teaserBackgroundPath}
        />
      );
    }

    if (scene === 0) {
      if (template === 'player-of-round') {
        const entry = entryLeader as PlayerOfRoundEntry | undefined;
        const posterRows = (entries ?? []).map((item) => ({
          rank: item.rank,
          name: getPlayerName(item),
          stat: 'rating' in item ? `${item.rating}` : '',
          badge: getEntryBadge(item),
        }));
        if (posterRows.length) {
          return (
            <PosterShell
              leagueName={leagueName}
              label={label}
              accentColor={accentColor}
              footer={isEnglish ? 'Full ranking!' : 'Ranking completo!'}
            >
              <PosterRankRows items={posterRows} accentColor={accentColor} />
            </PosterShell>
          );
        }
        return (
          <StatHero
            kicker={isEnglish ? 'Best rating' : 'Maior nota'}
            title={entry?.playerName || title}
            stat={entry ? `${entry.rating}` : undefined}
            badge={entry?.badge}
            accentColor={accentColor}
          />
        );
      }
      if (template === 'championship-pace' || template === 'relegation-line') {
        const entry = entryLeader as PaceEntry | undefined;
        return (
          <StatHero
            kicker={variant === 'relegation' ? (isEnglish ? 'Danger' : 'Risco') : isEnglish ? 'Pace' : 'Ritmo'}
            title={entry?.team || title}
            stat={entry ? `${entry.percentage}%` : undefined}
            badge={entry?.badge}
            accentColor={accentColor}
          />
        );
      }
      if (template === 'champion-final' || template === 'season-final-verdict') {
        return (
          <StatHero
            kicker={isEnglish ? 'Champion' : 'Campeão'}
            title={championTeam || getRankName(qualificationGroups?.[0]?.entries?.[0]) || title}
            stat={seasonLabel}
            badge={championBadge ?? qualificationGroups?.[0]?.entries?.[0]?.badge}
            accentColor={accentColor}
          />
        );
      }
      if (template === 'tierlist') {
        return (
          <StatHero
            kicker={isEnglish ? 'Favorite' : 'Favorito'}
            title={tierPick?.team || title}
            stat={topScorerPrediction || bestPlayerPrediction}
            badge={tierPick?.badge}
            accentColor={accentColor}
          />
        );
      }
      if (template === 'continental-groups-standings') {
        const row = groupRows[0];
        return (
          <StatHero
            kicker={groups?.[0]?.groupLabel || (isEnglish ? 'Group leader' : 'Líder do grupo')}
            title={row?.team || title}
            stat={row ? `${row.points} pts` : undefined}
            badge={row?.badge}
            accentColor={accentColor}
          />
        );
      }
      if (template === 'world-cup-knockout') {
        return <MainMatch fixture={matches?.[0]} label={label} accentColor={accentColor} />;
      }
      if (nextFixture) {
        const nextAsFixture = {
          homeTeam: nextFixture.homeTeam,
          awayTeam: nextFixture.awayTeam,
          homeScore: null,
          awayScore: null,
          homeBadge: nextFixture.homeBadge,
          awayBadge: nextFixture.awayBadge,
        };
        return <MainMatch fixture={nextAsFixture} label={label} accentColor={accentColor} />;
      }
      return <MainMatch fixture={fixture} label={label} accentColor={accentColor} />;
    }

    if (scene >= 1) {
      return (
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              color: accentColor,
              fontSize: 44,
              fontWeight: 900,
              textTransform: 'uppercase',
              marginBottom: 22,
            }}
          >
            {leagueName}
          </div>
          <div
            style={{
              ...TEASER_HEADLINE_EFFECT,
              color: '#f0f4f8',
              fontSize: title.length > 28 ? 72 : 90,
              lineHeight: 0.86,
              fontWeight: 900,
              textTransform: 'uppercase',
              textWrap: 'balance',
            }}
          >
            {label}
          </div>
          <div
            style={{
              margin: '30px auto 0',
              width: 180,
              height: 10,
              background: accentFill,
              boxShadow: `0 0 24px ${accentColor}88`,
            }}
          />
        </div>
      );
    }
  };

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background:
          `radial-gradient(circle at 50% 16%, ${accentColor}30, transparent 30%), ` +
          `radial-gradient(circle at 16% 78%, ${accentColor}1f, transparent 24%), #0b0d12`,
        color: '#ffffff',
        fontFamily: TEASER_NUMBER_FONT,
        fontStretch: 'condensed',
        letterSpacing: 0,
        WebkitFontSmoothing: 'antialiased',
        textRendering: 'geometricPrecision',
      }}
    >
      <FootballShortFontFaces />
      <TeaserBackdrop backgroundPath={teaserBackgroundPath} accentColor={accentColor} intensity={0.72} />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          backgroundImage:
            'linear-gradient(rgba(240,244,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(240,244,248,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 12,
          background: accentFill,
          boxShadow: `0 0 30px ${accentColor}88`,
        }}
      />
      {scene === 0 || isStaticPosterTeaser ? null : (
        <>
          <div
            style={{
              position: 'absolute',
              left: 62,
              right: 62,
              top: 70,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#f0f4f8',
              fontSize: 34,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            <span
              style={{
                maxWidth: 560,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {leagueName}
            </span>
            {metaLabel ? (
              <span
                style={{
                  maxWidth: 380,
                  padding: '10px 16px 8px',
                  borderRadius: 999,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  background: 'rgba(240,244,248,0.09)',
                  border: '1px solid rgba(240,244,248,0.14)',
                  color: accentColor,
                  fontSize: 25,
                }}
              >
                {metaLabel}
              </span>
            ) : null}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 58,
              right: 58,
              top: 122,
              color: 'rgba(240,244,248,0.055)',
              fontSize: leagueName.length > 18 ? 82 : 104,
              lineHeight: 0.82,
              fontWeight: 900,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            {leagueName}
          </div>
        </>
      )}
      <div
        style={{
          position: 'absolute',
          left: scene === 0 || isStaticPosterTeaser ? 0 : 58,
          right: scene === 0 || isStaticPosterTeaser ? 0 : 58,
          top: scene === 0 || isStaticPosterTeaser ? 0 : 230,
          bottom: scene === 0 || isStaticPosterTeaser ? 0 : 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 44,
        }}
      >
        {renderScene()}
      </div>
      {scene === 0 || isStaticPosterTeaser ? null : (
        <>
          <MoreChip count={moreCount} accentColor={accentColor} isEnglish={isEnglish} />
          <div style={{position: 'absolute', left: 58, right: 58, bottom: 70}}>
            <BadgeStrip teams={teamsForStrip} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

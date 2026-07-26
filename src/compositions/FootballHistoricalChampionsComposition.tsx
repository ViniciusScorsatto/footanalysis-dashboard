import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {
  FootballShortBackdrop,
  FootballShortFontFaces,
  TEASER_HEADLINE_FONT,
  TEASER_LABEL_FONT,
  TEASER_NUMBER_FONT,
} from '../components/FootballShortTeaserKit';
import {SoundtrackBed} from '../components/SoundtrackBed';
import type {
  FootballChannelProfile,
  HistoricalChampionEntry,
  LeagueConfig,
  TeamBadge,
} from '../lib/types';

type FootballHistoricalChampionsCompositionProps = {
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  entries: HistoricalChampionEntry[];
  channelProfile?: FootballChannelProfile;
  leagueConfig?: LeagueConfig;
  brandName: string;
  brandLogoPath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  ctaText?: string;
};

const BG = '#0b0d12';
const BORDER = '#1e2a3a';
const LIBERTADORES_GOLD = '#F39C12';
const SILVER = '#c0ccd8';
const STEEL = '#3a5060';
const WHITE = '#f0f4f8';

const badgeSrc = (badge: TeamBadge) =>
  badge.logoPath || badge.imagePath
    ? staticFile((badge.logoPath ?? badge.imagePath ?? '').replace(/^\//, ''))
    : null;

const countryMeta = (country: string) => {
  const normalized = country
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized === 'brazil' || normalized === 'brasil') return {code: 'BRA', flag: '🇧🇷'};
  if (normalized === 'argentina') return {code: 'ARG', flag: '🇦🇷'};
  if (normalized === 'colombia') return {code: 'COL', flag: '🇨🇴'};
  if (normalized === 'uruguay') return {code: 'URU', flag: '🇺🇾'};
  if (normalized === 'chile') return {code: 'CHI', flag: '🇨🇱'};

  return {code: country.slice(0, 3).toUpperCase(), flag: ''};
};

const fitHeroClubFontSize = (clubName: string) => {
  const length = clubName.trim().length;
  if (length > 18) return 48;
  if (length > 14) return 54;
  return 64;
};

const fitRowClubFontSize = (clubName: string) => {
  const length = clubName.trim().length;
  if (length > 18) return 24;
  if (length > 14) return 26;
  return 30;
};

const compactClubName = (clubName: string) => {
  const normalized = clubName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized === 'atletico nacional') return 'Atl. Nacional';
  if (normalized === 'athletico-pr') return 'Athletico';

  return clubName;
};

const isInternationalCompetition = (competitionName: string) => {
  const normalized = competitionName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return /libertadores|sul-americana|champions|world cup|copa do mundo|euro|copa america|mundial/.test(
    normalized
  );
};

const shouldShowDomesticRunnerUp = (
  entries: HistoricalChampionEntry[],
  competitionName: string
) => {
  if (isInternationalCompetition(competitionName)) {
    return false;
  }

  const countries = new Set(
    entries
      .map((entry) => entry.country.trim().toLowerCase())
      .filter(Boolean)
  );

  return countries.size === 1;
};

const fitRunnerUpFontSize = (runnerUp: string) => {
  const length = runnerUp.trim().length;
  if (length > 20) return 17;
  if (length > 15) return 19;
  return 21;
};

const ChampionRow = ({
  entry,
  rowIndex,
  showRunnerUp,
}: {
  entry: HistoricalChampionEntry;
  rowIndex: number;
  showRunnerUp: boolean;
}) => {
  const logoSrc = badgeSrc(entry.badge);
  const meta = countryMeta(entry.country);
  const clubLabel = compactClubName(entry.clubName);
  const runnerUpLabel = compactClubName(entry.runnerUp ?? '');

  return (
    <div
      style={{
        height: 78,
        borderRadius: 20,
        border: `2px solid rgba(192,204,216,${rowIndex % 2 === 0 ? 0.24 : 0.17})`,
        background: 'linear-gradient(90deg, rgba(20,28,36,0.88), rgba(8,11,16,0.88))',
        display: 'grid',
        gridTemplateColumns: showRunnerUp
          ? '104px 2px 82px 1fr 230px'
          : '104px 2px 82px 1fr 68px 46px',
        alignItems: 'center',
        columnGap: 16,
        padding: '0 22px 0 28px',
        boxShadow: '0 10px 20px rgba(0,0,0,0.28)',
      }}
    >
      <div
        style={{
          fontFamily: TEASER_NUMBER_FONT,
          fontSize: 38,
          fontWeight: 900,
          color: SILVER,
          fontStyle: 'italic',
          lineHeight: 1,
        }}
      >
        {entry.year}
      </div>
      <div style={{width: 2, height: 48, background: 'rgba(192,204,216,0.28)'}} />
      <div style={{width: 72, height: 72, display: 'grid', placeItems: 'center'}}>
        {logoSrc ? (
          <Img
            src={logoSrc}
            style={{
              width: 62,
              height: 62,
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.52))',
            }}
          />
        ) : (
          <span style={{fontFamily: TEASER_LABEL_FONT, fontSize: 19, color: WHITE}}>
            {entry.badge.label}
          </span>
        )}
      </div>
      <div
        style={{
          minWidth: 0,
          fontFamily: TEASER_NUMBER_FONT,
          fontSize: fitRowClubFontSize(clubLabel),
          fontWeight: 900,
          color: WHITE,
          textTransform: 'uppercase',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {clubLabel}
      </div>
      {showRunnerUp ? (
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            textAlign: 'right',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              fontFamily: TEASER_LABEL_FONT,
              fontSize: 12,
              color: SILVER,
              opacity: 0.62,
            }}
          >
            Vice
          </div>
          <div
            style={{
              maxWidth: 230,
              fontFamily: TEASER_NUMBER_FONT,
              fontSize: fitRunnerUpFontSize(runnerUpLabel),
              fontWeight: 900,
              color: SILVER,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {runnerUpLabel || '-'}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              fontFamily: TEASER_LABEL_FONT,
              fontSize: 21,
              color: SILVER,
              opacity: 0.74,
              textAlign: 'right',
            }}
          >
            {meta.code}
          </div>
          <div style={{fontSize: 28, lineHeight: 1, textAlign: 'right'}}>{meta.flag}</div>
        </>
      )}
    </div>
  );
};

const competitionChipLabel = (leagueName: string) =>
  leagueName.replace(/^copa\s+libertadores$/i, 'Libertadores').trim();

const CompetitionChip = ({
  accentColor,
  label,
}: {
  accentColor: string;
  label: string;
}) => {
  const displayLabel = competitionChipLabel(label);
  const labelLength = displayLabel.length;
  const fontSize = labelLength > 18 ? 24 : labelLength > 14 ? 28 : 34;
  const letterSpacing = labelLength > 18 ? 6 : labelLength > 14 ? 9 : 14;

  return (
    <div
      style={{
        margin: '12px auto 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      <div
        style={{
          width: 134,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${accentColor})`,
        }}
      />
      <div
        style={{
          minWidth: 462,
          maxWidth: 620,
          height: 58,
          padding: '0 28px',
          borderRadius: 8,
          background: `linear-gradient(180deg, #ffe070, ${accentColor})`,
          color: '#101318',
          display: 'grid',
          placeItems: 'center',
          fontFamily: TEASER_LABEL_FONT,
          fontSize,
          letterSpacing,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          boxShadow: `0 10px 26px ${accentColor}26`,
        }}
      >
        {displayLabel}
      </div>
      <div
        style={{
          width: 134,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />
    </div>
  );
};

const HeroChampion = ({
  entry,
  accentColor,
  showRunnerUp,
}: {
  entry: HistoricalChampionEntry;
  accentColor: string;
  showRunnerUp: boolean;
}) => {
  const logoSrc = badgeSrc(entry.badge);
  const runnerUpLabel = compactClubName(entry.runnerUp ?? '');

  return (
    <div
      style={{
        position: 'relative',
        height: 360,
        margin: '48px auto 24px',
        width: 760,
        borderRadius: 28,
        border: '2px solid rgba(192,204,216,0.34)',
        background: 'linear-gradient(180deg, rgba(14,18,23,0.95), rgba(8,10,14,0.92))',
        boxShadow: `0 0 42px ${accentColor}26, inset 0 0 80px rgba(0,0,0,0.52)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -38,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 74,
          borderRadius: 10,
          background: `linear-gradient(180deg, #ffe070, ${accentColor})`,
          display: 'grid',
          placeItems: 'center',
          color: '#101318',
          fontFamily: TEASER_NUMBER_FONT,
          fontSize: 52,
          fontWeight: 900,
          fontStyle: 'italic',
          boxShadow: `0 12px 22px ${accentColor}30`,
        }}
      >
        {entry.year}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 44%, ${accentColor}44, transparent 34%)`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 210,
          height: 210,
          display: 'grid',
          placeItems: 'center',
          marginTop: 10,
        }}
      >
        {logoSrc ? (
          <Img
            src={logoSrc}
            style={{
              width: 190,
              height: 190,
              objectFit: 'contain',
              filter: 'drop-shadow(0 18px 20px rgba(0,0,0,0.55))',
            }}
          />
        ) : (
          <div style={{fontFamily: TEASER_HEADLINE_FONT, fontSize: 58, color: WHITE}}>
            {entry.badge.label}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 22,
          fontFamily: TEASER_HEADLINE_FONT,
          fontSize: fitHeroClubFontSize(entry.clubName),
          fontWeight: 900,
          fontStyle: 'italic',
          color: WHITE,
          textTransform: 'uppercase',
          lineHeight: 1,
          textAlign: 'center',
          textShadow: '0 8px 18px rgba(0,0,0,0.72)',
          maxWidth: 660,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {entry.clubName}
      </div>
      {showRunnerUp ? (
        <div
          style={{
            position: 'relative',
            marginTop: 14,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 12,
            maxWidth: 650,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              fontFamily: TEASER_LABEL_FONT,
              fontSize: 18,
              color: SILVER,
              opacity: 0.66,
            }}
          >
            Vice
          </span>
          <span
            style={{
              minWidth: 0,
              fontFamily: TEASER_NUMBER_FONT,
              fontSize: fitRunnerUpFontSize(runnerUpLabel) + 5,
              fontWeight: 900,
              color: accentColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 6px 14px rgba(0,0,0,0.62)',
            }}
          >
            {runnerUpLabel || '-'}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export const FootballHistoricalChampionsComposition = ({
  titleLabel,
  subtitleLabel,
  entries,
  leagueConfig,
  brandName,
  brandLogoPath,
  soundtrackPath,
  soundtrackVolume,
  ctaText,
}: FootballHistoricalChampionsCompositionProps) => {
  const accentColor = leagueConfig?.accentColor ?? LIBERTADORES_GOLD;
  const sortedEntries = [...entries].sort((left, right) => left.year - right.year).slice(-10);
  const heroChampion = sortedEntries.at(-1);
  const previousChampions = sortedEntries.slice(0, -1).reverse();
  const competitionName = leagueConfig?.leagueName ?? subtitleLabel;
  const showRunnerUp = shouldShowDomesticRunnerUp(sortedEntries, competitionName);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: BG,
        color: WHITE,
        fontFamily: TEASER_NUMBER_FONT,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed soundtrackPath={soundtrackPath} volume={soundtrackVolume} />
      <FootballShortBackdrop template="historical-champions" accentColor={accentColor} opacity={0.36} />
      <CompetitionAccentRail accentColor={accentColor} width={8} />
      <Img
        src={staticFile('backgrounds/champion-final-shield-trophy.png')}
        style={{
          position: 'absolute',
          right: -245,
          top: 30,
          width: 640,
          height: 640,
          objectFit: 'contain',
          opacity: 0.14,
          filter: 'grayscale(1) contrast(1.2) brightness(0.72)',
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
          position: 'absolute',
          inset: 0,
          background:
            `linear-gradient(180deg, rgba(11,13,18,0.04), rgba(11,13,18,0.78) 78%, rgba(11,13,18,0.96)), radial-gradient(circle at 50% 26%, ${accentColor}20, transparent 24%)`,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          padding: '64px 110px 150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            margin: '8px auto 0',
            padding: '12px 34px',
            border: `2px solid ${accentColor}88`,
            borderRadius: 8,
            background: 'rgba(8,10,14,0.68)',
            boxShadow: `0 0 22px ${accentColor}30`,
            textAlign: 'center',
            fontFamily: TEASER_LABEL_FONT,
            fontSize: 34,
            color: accentColor,
            textTransform: 'uppercase',
          }}
        >
          Quem leva esse ano?
        </div>
        <div
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontFamily: TEASER_HEADLINE_FONT,
            fontSize: 74,
            fontWeight: 900,
            fontStyle: 'italic',
            color: WHITE,
            textTransform: 'uppercase',
            lineHeight: 0.92,
            textShadow: '0 8px 22px rgba(0,0,0,0.62)',
          }}
        >
          {titleLabel}
        </div>
        <CompetitionChip accentColor={accentColor} label={competitionName} />
        <div
          style={{
            marginTop: 12,
            textAlign: 'center',
            fontFamily: TEASER_LABEL_FONT,
            fontSize: 19,
            color: STEEL,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {subtitleLabel}
        </div>

        {heroChampion ? (
          <HeroChampion
            entry={heroChampion}
            accentColor={accentColor}
            showRunnerUp={showRunnerUp}
          />
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            padding: '0 28px',
          }}
        >
          {previousChampions.map((entry, index) => (
            <ChampionRow
              key={`${entry.year}-${entry.clubId}`}
              entry={entry}
              rowIndex={index}
              showRunnerUp={showRunnerUp}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            textAlign: 'center',
            fontFamily: TEASER_LABEL_FONT,
            fontSize: 25,
            color: SILVER,
            textTransform: 'uppercase',
            letterSpacing: 7,
          }}
        >
          {ctaText ?? 'Qual foi o melhor campeão?'}
        </div>
        <div
          style={{
            width: 420,
            height: 4,
            margin: '14px auto 0',
            background: accentColor,
            boxShadow: `0 0 18px ${accentColor}66`,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          right: 46,
          bottom: 34,
          zIndex: 5,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
      </div>
    </AbsoluteFill>
  );
};

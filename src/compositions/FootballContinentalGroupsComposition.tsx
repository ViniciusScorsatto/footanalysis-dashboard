import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {
  FootballShortOpening,
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
import type {
  ContinentalGroupStandingsGroup,
  FootballColdOpenData,
  LeagueConfig,
  TeamBadge,
} from '../lib/types';

const GROUPS_PER_PAGE = 2;
import {nationsLeagueDivision, nationsLeagueLegend, nationsLeagueZone, type NationsLeagueZone} from '../lib/nationsLeague';

type FootballContinentalGroupsCompositionProps = {
  season?: number;
  leagueId: number;
  leagueName: string;
  languageProfile?: 'pt-br' | 'en';
  titleLabel: string;
  subtitleLabel: string;
  tableLabels: {
    pos: string;
    team: string;
    gd: string;
    pts: string;
  };
  groups: ContinentalGroupStandingsGroup[];
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

export const FootballContinentalGroupsComposition = ({
  season,
  leagueId,
  leagueName,
  languageProfile = 'pt-br',
  titleLabel,
  subtitleLabel,
  tableLabels,
  groups,
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
}: FootballContinentalGroupsCompositionProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const isNationsLeague = leagueId === 5;
  const usesTransitionRules = isNationsLeague && season === 2026;
  const openingFrames = isNationsLeague ? 0 : SHORT_OPENING_DURATION_FRAMES;
  const contentFrame =
    Math.max(0, frame - openingFrames);
  const contentDurationInFrames = Math.max(1, durationInFrames - openingFrames);
  const accentColor = leagueConfig?.accentColor ?? '#F0A500';
  const pages = chunkGroups(isNationsLeague
    ? [...groups].sort((a, b) => a.groupKey.localeCompare(b.groupKey))
    : groups, GROUPS_PER_PAGE);
  const activePageIndex =
    pages.length <= 1
      ? 0
      : Math.min(Math.floor((contentFrame / contentDurationInFrames) * pages.length), pages.length - 1);
  const activeGroups = pages[activePageIndex] ?? [];
  const legend = usesTransitionRules
    ? nationsLeagueLegend(nationsLeagueDivision(activeGroups[0]?.groupKey ?? ''), languageProfile === 'en')
    : getLegendItems(leagueId, languageProfile, accentColor);
  const hasPending = usesTransitionRules && activeGroups.some((group) =>
    group.rows.some((row) => nationsLeagueZone(group, row, groups) === 'pending'));
  const activeLeagueLabels = isNationsLeague
    ? [...new Set(activeGroups.map((group) => group.groupKey.match(/^([A-D])\d+$/i)?.[1]?.toUpperCase()))]
        .filter(Boolean)
        .map((league) => `${languageProfile === 'en' ? 'League' : 'Liga'} ${league}`)
    : [];

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#ffffff',
        background: '#0b0d12',
        fontFamily: TEASER_NUMBER_FONT,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        loop={isNationsLeague}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop
        template="continental-groups-standings"
        accentColor={accentColor}
        opacity={0.5}
      />
      {!isNationsLeague ? <FootballShortOpening
        template="continental-groups-standings"
        channelProfile={languageProfile === 'en' ? 'en' : 'pt'}
        leagueName={leagueName}
        titleLabel={titleLabel}
        subtitleLabel={subtitleLabel}
        groups={groups}
        accentColor={accentColor}
        secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
      /> : null}

      <Sequence from={openingFrames}>
        <VoiceoverBed voiceoverPath={voiceoverPath} />
        <CompetitionAccentRail
          accentColor={accentColor}
          secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: accentColor,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: isNationsLeague ? '96px 120px 200px 72px' : '40px 28px 136px 72px',
            boxSizing: 'border-box',
          }}
        >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 18px 8px',
                borderRadius: 999,
                background: '#0f1318',
                borderLeft: `8px solid ${accentColor}`,
                color: accentColor,
                fontFamily: TEASER_LABEL_FONT,
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {leagueName}
            </div>

            <div
              style={{
                fontSize: isNationsLeague ? 68 : 86,
                lineHeight: 0.92,
                fontWeight: 900,
                fontFamily: TEASER_HEADLINE_FONT,
                letterSpacing: 0,
                textTransform: 'uppercase',
                color: accentColor,
              }}
            >
              {titleLabel}
            </div>

            <div
              style={{
                color: '#3a5060',
                fontSize: isNationsLeague ? 28 : 42,
                lineHeight: 1,
                fontWeight: 600,
                fontFamily: TEASER_LABEL_FONT,
                textTransform: 'uppercase',
              }}
            >
              {activeLeagueLabels.length > 0 ? activeLeagueLabels.join(' · ') : subtitleLabel}
            </div>
          </div>

          {pages.length > 1 ? (
            <div
              style={{
                display: 'flex',
                gap: 8,
                paddingTop: 16,
              }}
            >
              {isNationsLeague ? <div style={{fontSize: 22, whiteSpace: 'nowrap', color: '#c0ccd8'}}>{activePageIndex + 1} / {pages.length}</div> : pages.map((_, pageIdx) => (
                <div
                  key={pageIdx}
                  style={{
                    width: pageIdx === activePageIndex ? 28 : 10,
                    height: 10,
                    borderRadius: 999,
                    background: pageIdx === activePageIndex ? accentColor : '#27303d',
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 26,
            marginTop: 28,
            flex: 1,
            alignContent: isNationsLeague ? 'center' : undefined,
            flexShrink: 0,
          }}
        >
          {activeGroups.map((group) => (
            <GroupCard
              key={`${activePageIndex}-${group.groupKey}-${group.rows[0]?.team}`}
              leagueId={leagueId}
              group={group}
              zones={usesTransitionRules ? group.rows.map((row) => nationsLeagueZone(group, row, groups)) : undefined}
              tableLabels={tableLabels}
              accentColor={accentColor}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {legend.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px 10px',
                borderRadius: 999,
                background: '#0f1318',
                border: '1px solid #1e2a3a',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: item.color,
                  boxShadow: `0 0 14px ${item.color}55`,
                }}
              />
              <div
                style={{
                  color: '#c0ccd8',
                  fontFamily: TEASER_NUMBER_FONT,
                  fontSize: 18,
                  lineHeight: 1,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            paddingRight: isNationsLeague ? 0 : 120,
            paddingTop: 24,
          }}
        >
          {usesTransitionRules ? <div style={{fontSize: 18, color: '#8da0b3', maxWidth: 480}}>
            {languageProfile === 'en' ? '2026/27 • Based on current standings' : '2026/27 • Classificação atual'}
            {hasPending ? (languageProfile === 'en' ? ' • Grey: cross-group tie-break pending' : ' • Cinza: desempate entre grupos pendente') : ''}
          </div> : ctaText?.trim() ? (
            <div
              style={{
                maxWidth: 560,
                padding: '16px 24px 14px',
                borderRadius: 20,
                background: '#0f1318',
                border: `2px solid ${accentColor}`,
                color: '#ffffff',
                fontSize: isNationsLeague ? 24 : 34,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
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
      </Sequence>
    </AbsoluteFill>
  );
};

const GroupCard = ({
  zones,
  leagueId,
  group,
  tableLabels,
  accentColor,
}: {
  leagueId: number;
  group: ContinentalGroupStandingsGroup;
  zones?: NationsLeagueZone[];
  tableLabels: {
    pos: string;
    team: string;
    gd: string;
    pts: string;
  };
  accentColor: string;
}) => {
  return (
    <div
      style={{
        borderRadius: 28,
        padding: '22px 22px 18px',
        background: '#0f1318',
        border: '1px solid #1d2430',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            padding: '8px 16px 6px',
            borderRadius: 999,
            background: '#131926',
            color: accentColor,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          {group.groupLabel}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: leagueId === 5 ? '60px minmax(0, 1fr) 68px 68px' : '88px 1fr 96px 96px',
          alignItems: 'center',
          gap: 14,
          padding: '0 6px 10px',
          color: '#3a5060',
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
        }}
      >
        <div>{tableLabels.pos}</div>
        <div>{tableLabels.team}</div>
        <div style={{textAlign: 'right'}}>{tableLabels.gd}</div>
        <div style={{textAlign: 'right'}}>{tableLabels.pts}</div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {group.rows.map((row, index) => (
            <GroupRow
              key={`${group.groupKey}-${row.rank}`}
              leagueId={leagueId}
              groupLabel={group.groupLabel}
              row={row}
              zone={zones?.[index]}
              accentColor={accentColor}
            />
        ))}
      </div>
    </div>
  );
};

const GroupRow = ({
  zone,
  leagueId,
  groupLabel,
  row,
  accentColor,
}: {
  leagueId: number;
  groupLabel: string;
  zone?: NationsLeagueZone;
  row: ContinentalGroupStandingsGroup['rows'][number];
  accentColor: string;
}) => {
  const color = zone ? ({quarters: '#0A84FF', promotion: '#27AE60', playoff: '#E67E22', playoffBC: '#A78BFA', relegation: '#E74C3C', stay: '#8da0b3', pending: '#8da0b3'}[zone]) : undefined;
  const tone = color ? {background: `${color}18`, accent: color, rankColor: color, ptsColor: color}
    : getRowTone(leagueId, row.rank, accentColor, groupLabel);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: leagueId === 5 ? '60px minmax(0, 1fr) 68px 68px' : '88px 1fr 96px 96px',
        alignItems: 'center',
        gap: 14,
        minHeight: leagueId === 5 ? 78 : 90,
        padding: '0 14px 0 0',
        borderRadius: 24,
        background: tone.background,
        borderLeft: `6px solid ${tone.accent}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'stretch',
          borderRadius: '18px 0 0 18px',
          background: '#131926',
          color: tone.rankColor,
          fontSize: 42,
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        {row.rank}
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 14, minWidth: 0}}>
        <Badge badge={row.badge} />
        <div
          style={{
            minWidth: 0,
            color: '#ffffff',
            fontSize: leagueId === 5 ? 28 : 34,
            lineHeight: 1,
            fontWeight: 800,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.team}
        </div>
      </div>

      <div
        style={{
          textAlign: 'right',
          color: '#cfd7de',
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 800,
        }}
      >
        {formatSignedNumber(row.goalDifference)}
      </div>

      <div
        style={{
          justifySelf: 'end',
          width: 72,
          height: 60,
          borderRadius: 18,
          background: '#131926',
          color: tone.ptsColor,
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {row.points}
      </div>
    </div>
  );
};

const Badge = ({badge}: {badge: TeamBadge}) => {
  if (badge.logoPath || badge.imagePath) {
    const src = staticFile((badge.logoPath ?? badge.imagePath ?? '').replace(/^\//, ''));
    return (
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 999,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Img
          src={src}
          style={{
            width: '78%',
            height: '78%',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 999,
        background: '#131926',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: 20,
        lineHeight: 1,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {badge.label}
    </div>
  );
};

const getRowTone = (
  leagueId: number,
  rank: number,
  accentColor: string,
  groupLabel = ''
) => {
  if (leagueId === 5) {
    const league = (groupLabel.match(/^([a-d])\d+$/i)?.[1] ?? groupLabel.match(/(?:league|liga)\s+([a-d])/i)?.[1])?.toUpperCase();

    if (league === 'A' && rank <= 2) {
      return {
        background: 'rgba(10, 132, 255, 0.14)',
        accent: '#0A84FF',
        rankColor: '#0A84FF',
        ptsColor: '#0A84FF',
      };
    }

    if (['B', 'C', 'D'].includes(league ?? '') && rank === 1) {
      return {
        background: 'rgba(39, 174, 96, 0.14)',
        accent: '#27AE60',
        rankColor: '#5be08d',
        ptsColor: '#27AE60',
      };
    }

    if (['A', 'B'].includes(league ?? '') && rank === 4) {
      return {
        background: 'rgba(231, 76, 60, 0.14)',
        accent: '#E74C3C',
        rankColor: '#E74C3C',
        ptsColor: '#E74C3C',
      };
    }
  }

  if (leagueId === 11) {
    if (rank === 1) {
      return {
        background: 'rgba(240, 165, 0, 0.12)',
        accent: '#F0A500',
        rankColor: '#F0A500',
        ptsColor: '#F0A500',
      };
    }

    if (rank === 2) {
      return {
        background: 'rgba(26, 188, 156, 0.12)',
        accent: '#1ABC9C',
        rankColor: '#1ABC9C',
        ptsColor: '#1ABC9C',
      };
    }
  }

  if (leagueId === 13 && rank <= 2) {
    return {
      background: 'rgba(243, 156, 18, 0.12)',
      accent: '#F39C12',
      rankColor: '#F39C12',
      ptsColor: '#F39C12',
    };
  }

  if (leagueId === 13 && rank === 3) {
    return {
      background: 'rgba(26, 188, 156, 0.12)',
      accent: '#1ABC9C',
      rankColor: '#1ABC9C',
      ptsColor: '#1ABC9C',
    };
  }

  if (rank <= 2) {
    return {
      background: 'rgba(39, 174, 96, 0.12)',
      accent: '#27AE60',
      rankColor: '#5be08d',
      ptsColor: '#27AE60',
    };
  }

  return {
    background: '#10151c',
    accent: `${accentColor}44`,
    rankColor: '#8da0b3',
    ptsColor: '#cfd7de',
  };
};

const formatSignedNumber = (value: number) => {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
};

const chunkGroups = (groups: ContinentalGroupStandingsGroup[], size: number) => {
  const pages: ContinentalGroupStandingsGroup[][] = [];
  for (let index = 0; index < groups.length; index += size) {
    pages.push(groups.slice(index, index + size));
  }
  return pages;
};

const getLegendItems = (
  leagueId: number,
  languageProfile: 'pt-br' | 'en',
  accentColor: string
) => {
  if (leagueId === 11) {
    return languageProfile === 'en'
      ? [
          {color: '#F0A500', label: '1st place • Round of 16'},
          {color: '#1ABC9C', label: '2nd place • Playoff'},
        ]
      : [
          {color: '#F0A500', label: '1º lugar • Oitavas'},
          {color: '#1ABC9C', label: '2º lugar • Playoff'},
        ];
  }

  if (leagueId === 13) {
    return languageProfile === 'en'
      ? [
          {color: '#F39C12', label: 'Top 2 • Round of 16'},
          {color: '#1ABC9C', label: '3rd place • Sulamericana Playoffs'},
        ]
      : [
          {color: '#F39C12', label: 'Top 2 • Oitavas'},
          {color: '#1ABC9C', label: '3º lugar • Playoffs Sulamericana'},
        ];
  }

  if (leagueId === 5) {
    return languageProfile === 'en'
      ? [
          {color: '#0A84FF', label: 'League A top 2 • Quarter-finals'},
          {color: '#27AE60', label: 'League B/C/D group winners • Promoted'},
          {color: '#E67E22', label: 'Promotion/Relegation Play-offs'},
          {color: '#E74C3C', label: 'League A/B bottom place • Relegated'},
        ]
      : [
          {color: '#0A84FF', label: 'Top 2 da Liga A • Quartas de final'},
          {color: '#27AE60', label: 'Vencedores dos grupos B/C/D • Promovidos'},
          {color: '#E67E22', label: 'Play-offs de promoção/rebaixamento'},
          {color: '#E74C3C', label: 'Último das Ligas A/B • Rebaixado'},
        ];
  }

  return languageProfile === 'en'
    ? [{color: '#27AE60', label: 'Top 2 • Advance'}]
    : [{color: '#27AE60', label: 'Top 2 • Avançam'}];
};

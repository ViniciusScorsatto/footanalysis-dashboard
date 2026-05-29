import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {FootballColdOpen} from '../components/FootballColdOpen';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import type {
  ContinentalGroupStandingsGroup,
  FootballColdOpenData,
  LeagueConfig,
  TeamBadge,
} from '../lib/types';

const GROUPS_PER_PAGE = 2;

type FootballContinentalGroupsCompositionProps = {
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
  const accentColor = leagueConfig?.accentColor ?? '#F0A500';
  const pages = chunkGroups(groups, GROUPS_PER_PAGE);
  const activePageIndex =
    pages.length <= 1
      ? 0
      : Math.min(Math.floor((frame / durationInFrames) * pages.length), pages.length - 1);
  const activeGroups = pages[activePageIndex] ?? [];

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        color: '#ffffff',
        background: '#0b0d12',
        fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
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
          padding: '40px 28px 136px 72px',
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
                fontFamily: '"Barlow", "Arial", sans-serif',
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
                fontSize: 86,
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: -2.4,
                textTransform: 'uppercase',
                color: accentColor,
              }}
            >
              {titleLabel}
            </div>

            <div
              style={{
                color: '#3a5060',
                fontSize: 42,
                lineHeight: 1,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {subtitleLabel}
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
              {pages.map((_, pageIdx) => (
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
          }}
        >
          {activeGroups.map((group) => (
            <GroupCard
              key={group.groupKey}
              leagueId={leagueId}
              group={group}
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
          {getLegendItems(leagueId, languageProfile, accentColor).map((item) => (
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
                  fontFamily: '"Poppins", "Barlow", sans-serif',
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
            paddingRight: 120,
          }}
        >
          {ctaText?.trim() ? (
            <div
              style={{
                maxWidth: 560,
                padding: '16px 24px 14px',
                borderRadius: 20,
                background: '#0f1318',
                border: `2px solid ${accentColor}`,
                color: '#ffffff',
                fontSize: 34,
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
    </AbsoluteFill>
  );
};

const GroupCard = ({
  leagueId,
  group,
  tableLabels,
  accentColor,
}: {
  leagueId: number;
  group: ContinentalGroupStandingsGroup;
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
          gridTemplateColumns: '88px 1fr 96px 96px',
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
        {group.rows.map((row) => (
          <GroupRow
            key={`${group.groupKey}-${row.rank}`}
            leagueId={leagueId}
            row={row}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
};

const GroupRow = ({
  leagueId,
  row,
  accentColor,
}: {
  leagueId: number;
  row: ContinentalGroupStandingsGroup['rows'][number];
  accentColor: string;
}) => {
  const tone = getRowTone(leagueId, row.rank, accentColor);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr 96px 96px',
        alignItems: 'center',
        gap: 14,
        minHeight: 90,
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
            fontSize: 34,
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

const getRowTone = (leagueId: number, rank: number, accentColor: string) => {
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

  return languageProfile === 'en'
    ? [{color: '#27AE60', label: 'Top 2 • Advance'}]
    : [{color: '#27AE60', label: 'Top 2 • Avançam'}];
};

import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FootballChannelProfile, StandingRow, StandingsZoneConfig} from '../lib/types';
import {entranceStyle, rowStartFrame} from '../lib/animations';

type StandingsTableProps = {
  rows: StandingRow[];
  zones: StandingsZoneConfig[];
  channelProfile?: FootballChannelProfile;
  disableAnimation?: boolean;
};

const findZone = (rank: number, zones: StandingsZoneConfig[]) =>
  zones.find((zone) => rank >= zone.start && rank <= zone.end);

const isDangerZone = (zone?: StandingsZoneConfig) => {
  const key = `${zone?.key ?? ''} ${zone?.label ?? ''}`.toLowerCase();
  return (
    key.includes('bottom') ||
    key.includes('rebaix') ||
    key.includes('releg') ||
    key.includes('descenso') ||
    key.includes('z4')
  );
};

const isPromotionZone = (zone?: StandingsZoneConfig) => {
  const key = `${zone?.key ?? ''} ${zone?.label ?? ''}`.toLowerCase();
  return (
    key.includes('acesso') ||
    key.includes('promotion') ||
    key.includes('libert') ||
    key.includes('g4') ||
    key.includes('top')
  );
};

const isPlayoffZone = (zone?: StandingsZoneConfig) => {
  const key = `${zone?.key ?? ''} ${zone?.label ?? ''}`.toLowerCase();
  return (
    key.includes('playoff') ||
    key.includes('play-off') ||
    key.includes('quadrangular') ||
    key.includes('pre-libert') ||
    key.includes('pré-libert') ||
    key.includes('preliminar')
  );
};

const isSecondaryContinentalZone = (zone?: StandingsZoneConfig) => {
  const key = `${zone?.key ?? ''} ${zone?.label ?? ''}`.toLowerCase();
  return (
    key.includes('sul-americana') ||
    key.includes('sudamericana') ||
    key.includes('europa') ||
    key.includes('conference')
  );
};

export const StandingsTable = ({
  rows,
  zones,
  channelProfile = 'pt',
  disableAnimation = false,
}: StandingsTableProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hasConfiguredZones = zones.length > 0;
  const isEnglish = channelProfile === 'en';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 48px minmax(0, 1fr) 72px 72px 184px',
          alignItems: 'center',
          padding: '0 16px 8px',
          color: isEnglish ? '#4a6070' : '#3a5060',
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        <div>{isEnglish ? 'Pos' : 'Pos'}</div>
        <div />
        <div>{isEnglish ? 'Team' : 'Clube'}</div>
        <div style={{textAlign: 'center'}}>{isEnglish ? 'PL' : 'JG'}</div>
        <div style={{textAlign: 'center'}}>SG</div>
        <div style={{display: 'flex', justifyContent: 'flex-end', paddingRight: 4}}>
          PTS&nbsp;&nbsp;&nbsp;{isEnglish ? 'Form' : 'Forma'}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {rows.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              minHeight: 520,
              padding: 40,
              borderRadius: 20,
              background: '#0f1318',
              border: '1px solid #1e2a34',
              color: isEnglish ? '#4a6070' : '#3a5060',
              fontSize: 42,
              lineHeight: 1.05,
              fontWeight: 700,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {isEnglish
              ? 'No standings available yet'
              : 'Classificação ainda indisponível'}
          </div>
        ) : null}
        {rows.map((row, index) => {
          const zone = findZone(row.rank, zones);
          const variant =
            isDangerZone(zone) || (!hasConfiguredZones && row.rank >= Math.max(rows.length - 2, 1))
              ? 'danger'
              : isPlayoffZone(zone)
                ? 'playoff'
                : isPromotionZone(zone)
                  ? 'promotion'
                  : isSecondaryContinentalZone(zone)
                    ? 'continental'
                    : row.rank === 1
                      ? 'leader'
                      : 'default';
          const configuredBackground = zone?.fill;
          const configuredAccent = zone?.textColor ?? zone?.accent;
          const fallbackBackground =
            variant === 'leader'
              ? '#0b1409'
              : variant === 'promotion'
                ? '#18140b'
                : variant === 'playoff'
                  ? '#0b140f'
                  : variant === 'continental'
                    ? '#081517'
              : isDangerZone(zone) || (!hasConfiguredZones && row.rank >= Math.max(rows.length - 2, 1))
                ? '#140808'
                : index % 2 === 0
                  ? '#0f1318'
                  : '#141c24';
          const fallbackEnglishBackground =
            variant === 'leader'
              ? '#0a1828'
              : variant === 'promotion'
                ? '#080e18'
                : variant === 'playoff'
                  ? '#081410'
                  : variant === 'continental'
                    ? '#081410'
                    : variant === 'danger'
                      ? '#140808'
                      : index % 2 === 0
                        ? '#0f1318'
                        : '#141c24';
          const background =
            configuredBackground ?? fallbackBackground;
          const englishBackground = configuredBackground ?? fallbackEnglishBackground;
          const railColor =
            configuredAccent ??
            (isEnglish
              ? variant === 'leader' || variant === 'promotion'
                ? '#0A84FF'
                : variant === 'playoff' || variant === 'continental'
                  ? '#27AE60'
                  : variant === 'danger'
                    ? '#E74C3C'
                    : '#1e2a34'
              : variant === 'leader'
                ? '#F0A500'
                : variant === 'promotion'
                  ? '#F0A500'
                  : variant === 'playoff'
                    ? '#27AE60'
                    : variant === 'continental'
                      ? '#00B1B7'
                      : variant === 'danger'
                        ? '#E74C3C'
                        : background);
          const zoneTextColor =
            configuredAccent ??
            (isEnglish
              ? variant === 'leader' || variant === 'promotion'
                ? '#0A84FF'
                : variant === 'playoff' || variant === 'continental'
                  ? '#27AE60'
                  : variant === 'danger'
                    ? '#E74C3C'
                    : '#c0ccd8'
              : variant === 'leader'
                ? '#F0A500'
                : variant === 'promotion'
                  ? '#F0A500'
                  : variant === 'playoff'
                    ? '#27AE60'
                  : variant === 'continental'
                      ? '#00B1B7'
                      : variant === 'danger'
                      ? '#E74C3C'
                        : '#4a5a6a');
          const rankColor =
            isEnglish && zone
              ? '#f0f4f8'
              : zoneTextColor;
          const rankTextShadow =
            isEnglish && zone ? `0 2px 8px rgba(0,0,0,0.54), 0 0 12px ${railColor}88` : undefined;
          const teamColor = isEnglish ? '#f0f4f8' : '#ffffff';
          const statColor = isEnglish
            ? variant === 'danger'
              ? '#b59292'
              : '#c0ccd8'
            : variant === 'danger'
              ? '#8a7070'
              : '#c0ccd8';
          const pointsColor = zoneTextColor;

          const anim = disableAnimation
            ? {opacity: 1, transform: 'none'}
            : entranceStyle(frame, fps, rowStartFrame(index));

          return (
            <div
              key={`${row.rank}-${row.team}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 48px minmax(0, 1fr) 72px 72px 184px',
                alignItems: 'center',
                flex: 1,
                minHeight: 52,
                padding: '0 16px',
                background: isEnglish ? englishBackground : background,
                border: isEnglish ? '1px solid #1e2a3a' : 'none',
                borderLeft: `8px solid ${railColor}`,
                borderRadius: 12,
                ...anim,
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: rankColor,
                  textShadow: rankTextShadow,
                }}
              >
                {row.rank}
              </div>
              <Badge badge={row.badge} />
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  color: teamColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.team}
              </div>
              <div style={{fontSize: 28, textAlign: 'center', fontWeight: 700, color: statColor}}>
                {row.played}
              </div>
              <div style={{fontSize: 28, textAlign: 'center', fontWeight: 700, color: statColor}}>
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    textAlign: 'right',
                    color: pointsColor,
                  }}
                >
                  {row.points}
                </div>
                <FormDots form={row.form} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Badge = ({badge}: {badge: StandingRow['badge']}) => {
  if (badge.logoPath) {
    return (
        <Img
          src={staticFile(badge.logoPath.replace(/^\//, ''))}
          style={{
            width: 32,
            height: 32,
            objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 26,
        height: 26,
        display: 'grid',
        placeItems: 'center',
        fontSize: 14,
        fontWeight: 900,
      }}
    >
      {badge.label}
    </div>
  );
};

const FormDots = ({form = ''}: {form?: string}) => {
  const normalized = form
    .replace(/[^WDL]/gi, '')
    .slice(-5)
    .toUpperCase()
    .split('')
    .reverse()
    .join('');
  const dots = normalized.padStart(5, '-').split('');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 4,
      }}
    >
      {dots.map((value, index) => {
        const color =
          value === 'W'
            ? '#27AE60'
            : value === 'D'
              ? '#5a6a7a'
              : value === 'L'
                ? '#E74C3C'
                : '#141c24';
        return (
          <div
            key={`${value}-${index}`}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: color,
            }}
          />
        );
      })}
    </div>
  );
};

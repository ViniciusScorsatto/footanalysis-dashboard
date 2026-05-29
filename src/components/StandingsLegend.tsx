import type {FootballChannelProfile, StandingsZoneConfig} from '../lib/types';

type StandingsLegendProps = {
  zones: StandingsZoneConfig[];
  channelProfile?: FootballChannelProfile;
};

export const StandingsLegend = ({
  zones,
  channelProfile = 'pt',
}: StandingsLegendProps) => {
  if (zones.length === 0) {
    return null;
  }

  const isEnglish = channelProfile === 'en';

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px 24px',
        padding: '8px 0 0',
      }}
    >
      {zones.map((zone) => {
        const normalized = `${zone.key} ${zone.label}`.toLowerCase();
        const swatchColor =
          zone.textColor ??
          zone.accent ??
          (normalized.includes('bottom') ||
          normalized.includes('rebaix') ||
          normalized.includes('releg')
            ? '#E74C3C'
            : normalized.includes('playoff') ||
                  normalized.includes('quadrangular') ||
                  normalized.includes('pre-libert') ||
                  normalized.includes('pré-libert') ||
                  normalized.includes('preliminar') ||
                  normalized.includes('sul-americana') ||
                  normalized.includes('sudamericana') ||
                  normalized.includes('europa') ||
                  normalized.includes('conference')
                ? '#27AE60'
                : isEnglish
                  ? '#0A84FF'
                  : '#F0A500');

        return (
          <div
            key={zone.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 24,
                height: 8,
                borderRadius: 999,
                background: swatchColor,
              }}
            />
            <div
              style={{
                fontFamily: '"Barlow", "Arial", sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: isEnglish ? '#4a6070' : '#3a5060',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              {zone.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

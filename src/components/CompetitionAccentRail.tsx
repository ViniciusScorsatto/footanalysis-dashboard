type CompetitionAccentRailProps = {
  accentColor: string;
  secondaryAccentColor?: string;
  width?: number;
  left?: number;
};

export const CompetitionAccentRail = ({
  accentColor,
  secondaryAccentColor,
  width = 7,
  left = 0,
}: CompetitionAccentRailProps) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left,
      width,
      background: secondaryAccentColor
        ? `linear-gradient(180deg, ${accentColor} 0%, ${secondaryAccentColor} 100%)`
        : accentColor,
      boxShadow: `0 0 22px ${accentColor}88`,
      pointerEvents: 'none',
      zIndex: 200,
    }}
  />
);

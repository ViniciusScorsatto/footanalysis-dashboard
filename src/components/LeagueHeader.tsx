type LeagueHeaderProps = {
  leagueName: string;
  roundLabel: string;
};

export const LeagueHeader = ({leagueName, roundLabel}: LeagueHeaderProps) => {
  return (
    <div
      style={{
        position: 'relative',
        height: 242,
      }}
    >
      <HeaderPlate
        top={10}
        left={178}
        width={718}
        height={104}
        skew={-15}
        borderA="#5cb7ff"
        borderB="#ffbf53"
        glow="0 0 20px rgba(75, 132, 255, 0.6), 0 0 28px rgba(255, 191, 83, 0.35)"
      >
        <span
          style={{
            fontSize: 74,
            lineHeight: 1,
            letterSpacing: -2,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          {leagueName}
        </span>
      </HeaderPlate>

      <HeaderPlate
        top={108}
        left={210}
        width={704}
        height={78}
        skew={-12}
        borderA="#ffbf53"
        borderB="#ffd766"
        glow="0 0 18px rgba(255, 191, 83, 0.28)"
      >
        <span
          style={{
            fontSize: 38,
            lineHeight: 1,
            fontWeight: 900,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {roundLabel}
        </span>
      </HeaderPlate>
    </div>
  );
};

type HeaderPlateProps = {
  top: number;
  left: number;
  width: number;
  height: number;
  skew: number;
  borderA: string;
  borderB: string;
  glow: string;
  children: React.ReactNode;
};

const HeaderPlate = ({
  top,
  left,
  width,
  height,
  skew,
  borderA,
  borderB,
  glow,
  children,
}: HeaderPlateProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        transform: `skewX(${skew}deg)`,
        border: '4px solid transparent',
        borderImage: `linear-gradient(90deg, ${borderA}, ${borderB}) 1`,
        background:
          'linear-gradient(180deg, rgba(13,19,67,0.92), rgba(6,11,33,0.95)) padding-box',
        boxShadow: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `skewX(${-skew}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

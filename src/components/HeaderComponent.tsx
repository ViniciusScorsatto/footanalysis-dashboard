type HeaderComponentProps = {
  leagueName: string;
  seasonLabel: string;
};

export const HeaderComponent = ({
  leagueName,
  seasonLabel,
}: HeaderComponentProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <span
          style={{
            color: '#b6f27f',
            textTransform: 'uppercase',
            letterSpacing: 4,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          Football Standings
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: 82,
            lineHeight: 0.94,
            letterSpacing: -2.6,
          }}
        >
          {leagueName}
        </h1>
      </div>
      <div
        style={{
          borderRadius: 999,
          padding: '18px 26px',
          fontSize: 28,
          fontWeight: 700,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {seasonLabel}
      </div>
    </div>
  );
};

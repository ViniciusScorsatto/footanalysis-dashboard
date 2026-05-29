type FooterComponentProps = {
  footerText: string;
};

export const FooterComponent = ({footerText}: FooterComponentProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '26px 30px',
        borderRadius: 28,
        background: 'linear-gradient(135deg, rgba(182, 242, 127, 0.15), rgba(255, 255, 255, 0.06))',
        border: '1px solid rgba(182, 242, 127, 0.24)',
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: '#b6f27f',
          }}
        >
          Debate Starter
        </span>
        <span
          style={{
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -1.4,
          }}
        >
          {footerText}
        </span>
      </div>
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          fontSize: 42,
          fontWeight: 800,
        }}
      >
        ?
      </div>
    </div>
  );
};

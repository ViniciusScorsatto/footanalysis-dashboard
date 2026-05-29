import type {ReactNode} from 'react';
import type {StandingRow} from '../lib/types';

type TableComponentProps = {
  standings: StandingRow[];
};

const columns = [
  {label: '#', width: 90, align: 'left'},
  {label: 'Club', width: 420, align: 'left'},
  {label: 'P', width: 120, align: 'center'},
  {label: 'GD', width: 140, align: 'center'},
  {label: 'Pts', width: 140, align: 'right'},
] as const;

export const TableComponent = ({standings}: TableComponentProps) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '34px 28px 30px',
          textTransform: 'uppercase',
          fontSize: 24,
          letterSpacing: 2,
          color: 'rgba(247, 247, 239, 0.68)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.label}
            style={{
              width: column.width,
              textAlign: column.align,
              fontWeight: 700,
            }}
          >
            {column.label}
          </div>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
        {standings.map((row, index) => {
          const isTop = index < 3;
          const isBottom = index >= standings.length - 3;
          const accent = isTop ? '#9df7aa' : isBottom ? '#ff9a9a' : '#f7f7ef';

          return (
            <div
              key={row.team}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 28px',
                flex: 1,
                borderBottom:
                  index === standings.length - 1
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Cell width={90} align="left" strong color={accent}>
                {index + 1}
              </Cell>
              <Cell width={420} align="left" strong color={accent}>
                {row.team}
              </Cell>
              <Cell width={120} align="center">
                {row.played}
              </Cell>
              <Cell width={140} align="center">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </Cell>
              <Cell width={140} align="right" strong color={accent}>
                {row.points}
              </Cell>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type CellProps = {
  width: number;
  align: 'left' | 'center' | 'right';
  children: ReactNode;
  strong?: boolean;
  color?: string;
};

const Cell = ({width, align, children, strong = false, color}: CellProps) => {
  return (
    <div
      style={{
        width,
        textAlign: align,
        fontSize: strong ? 34 : 30,
        fontWeight: strong ? 700 : 500,
        letterSpacing: strong ? -0.8 : -0.3,
        color: color ?? '#f7f7ef',
      }}
    >
      {children}
    </div>
  );
};

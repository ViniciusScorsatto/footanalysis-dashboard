import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {
  FootballShortBackdrop,
  FootballShortFontFaces,
  TEASER_LABEL_FONT,
  TEASER_NUMBER_FONT,
} from '../components/FootballShortTeaserKit';
import {SoundtrackBed} from '../components/SoundtrackBed';
import {VoiceoverBed} from '../components/VoiceoverBed';
import {
  SHORT_MAIN_ENTRY_PREROLL_FRAMES,
  SHORT_OPENING_DURATION_FRAMES,
  FootballShortOpening,
} from '../components/FootballShortOpening';
import type {FootballComparisonVideoJob} from '../lib/types';

type Props = {
  job: FootballComparisonVideoJob;
};

const defaultAccent = '#A7FF12';

const metricValue = (value: unknown) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

const entryStyle = (frame: number, index: number) => ({
  opacity: interpolate(frame, [index * 5, index * 5 + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }),
  transform: `translateY(${interpolate(frame, [index * 5, index * 5 + 12], [22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })}px)`,
});

const EntityPanel = ({
  label,
  sublabel,
  logoPath,
  align,
}: {
  label: string;
  sublabel?: string;
  logoPath?: string;
  align: 'left' | 'right';
}) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      padding: '26px 22px',
      border: '1px solid rgba(255,255,255,0.16)',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: align === 'left' ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 18,
    }}
  >
    {logoPath ? (
      <Img
        src={staticFile(logoPath.replace(/^\//, ''))}
        style={{
          width: 84,
          height: 84,
          objectFit: 'contain',
          flex: '0 0 auto',
        }}
      />
    ) : null}
    <div style={{minWidth: 0, textAlign: align}}>
      <div
        style={{
          fontFamily: TEASER_LABEL_FONT,
          fontSize: 21,
          color: 'rgba(255,255,255,0.62)',
          textTransform: 'uppercase',
        }}
      >
        {sublabel}
      </div>
      <div
        style={{
          fontFamily: TEASER_NUMBER_FONT,
          fontSize: 42,
          lineHeight: 1,
          overflowWrap: 'anywhere',
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

export const FootballComparisonComposition = ({job}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const accentColor =
    job.leftEntity?.badge?.accentColor ?? job.rightEntity?.badge?.accentColor ?? defaultAccent;
  const hasEntities = job.leftEntity || job.rightEntity;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: '#0b0d12',
        color: '#fff',
        fontFamily: TEASER_NUMBER_FONT,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={job.soundtrackPath}
        volume={job.soundtrackVolume}
        duckUntilSeconds={job.voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop template="standings" accentColor={accentColor} opacity={0.54} />
      <FootballShortOpening
        template="standings"
        channelProfile={job.channelProfile}
        leagueName={job.leagueName}
        roundLabel={job.subtitleLabel}
        rows={[]}
        accentColor={accentColor}
        brandName={job.brandName}
        brandLogoPath={job.brandLogoPath}
        introTitle={job.introTitle ?? job.titleLabel}
        introSubtitle={job.introSubtitle ?? job.subtitleLabel}
        hookText={job.hookText}
        coldOpenData={job.coldOpenData}
      />
      <Sequence from={SHORT_OPENING_DURATION_FRAMES}>
        <VoiceoverBed voiceoverPath={job.voiceoverPath} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '54px 58px 96px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', gap: 28}}>
            <div>
              <div
                style={{
                  fontFamily: TEASER_LABEL_FONT,
                  fontSize: 28,
                  color: accentColor,
                  textTransform: 'uppercase',
                }}
              >
                {job.leagueName}
              </div>
              <div style={{fontSize: 68, lineHeight: 0.96, maxWidth: 760}}>
                {job.titleLabel}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: TEASER_LABEL_FONT,
                  fontSize: 28,
                  color: 'rgba(255,255,255,0.68)',
                }}
              >
                {job.subtitleLabel}
              </div>
            </div>
            <BrandMark brandName={job.brandName} brandLogoPath={job.brandLogoPath} />
          </div>

          {hasEntities ? (
            <div style={{display: 'flex', gap: 18, ...entryStyle(contentFrame, 0)}}>
              <EntityPanel
                label={job.leftEntity?.label ?? '-'}
                sublabel={job.leftEntity?.sublabel}
                logoPath={job.leftEntity?.badge?.logoPath}
                align="left"
              />
              <EntityPanel
                label={job.rightEntity?.label ?? '-'}
                sublabel={job.rightEntity?.sublabel}
                logoPath={job.rightEntity?.badge?.logoPath}
                align="right"
              />
            </div>
          ) : null}

          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            {job.metrics.slice(0, 6).map((metric, index) => (
              <div
                key={`${metric.label}-${index}`}
                style={{
                  ...entryStyle(contentFrame, index + 1),
                  display: 'grid',
                  gridTemplateColumns:
                    metric.leftValue !== undefined || metric.rightValue !== undefined
                      ? '1fr 1.1fr 1fr'
                      : '1.2fr 1fr',
                  alignItems: 'center',
                  gap: 18,
                  padding: '20px 22px',
                  background: 'rgba(0,0,0,0.42)',
                  borderLeft: `6px solid ${accentColor}`,
                }}
              >
                {metric.leftValue !== undefined || metric.rightValue !== undefined ? (
                  <>
                    <div style={{fontSize: 38}}>{metricValue(metric.leftValue)}</div>
                    <div
                      style={{
                        fontFamily: TEASER_LABEL_FONT,
                        fontSize: 24,
                        color: 'rgba(255,255,255,0.72)',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                      }}
                    >
                      {metric.label}
                    </div>
                    <div style={{fontSize: 38, textAlign: 'right'}}>{metricValue(metric.rightValue)}</div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: TEASER_LABEL_FONT,
                        fontSize: 24,
                        color: 'rgba(255,255,255,0.72)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {metric.label}
                    </div>
                    <div style={{fontSize: 38, textAlign: 'right'}}>{metricValue(metric.value)}</div>
                  </>
                )}
              </div>
            ))}
          </div>

          {job.rows?.length ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {job.rows.slice(0, 7).map((row, index) => (
                <div
                  key={`${row.label}-${index}`}
                  style={{
                    ...entryStyle(contentFrame, index + 8),
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr auto',
                    alignItems: 'center',
                    gap: 18,
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{fontSize: 30, color: accentColor}}>
                    {row.rank ? `#${row.rank}` : `#${index + 1}`}
                  </div>
                  <div style={{minWidth: 0}}>
                    <div style={{fontSize: 30, lineHeight: 1}}>{row.label}</div>
                    <div
                      style={{
                        fontFamily: TEASER_LABEL_FONT,
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.62)',
                      }}
                    >
                      {row.sublabel}
                    </div>
                  </div>
                  <div style={{fontSize: 32, textAlign: 'right'}}>{row.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          {job.ctaText ? (
            <div
              style={{
                marginTop: 'auto',
                fontFamily: TEASER_LABEL_FONT,
                fontSize: 30,
                color: '#101214',
                background: accentColor,
                padding: '16px 22px',
                alignSelf: 'flex-start',
              }}
            >
              {job.ctaText}
            </div>
          ) : null}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

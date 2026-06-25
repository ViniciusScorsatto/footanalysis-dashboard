import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {
  FootballShortOpening,
  SHORT_MAIN_ENTRY_PREROLL_FRAMES,
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
import {
  HEADER_STAGGER_FRAMES,
  accentWipeWidth,
  entranceStyle,
  fadeInStyle,
  footerStartFrame,
  headerEntranceStyle,
  rowStartFrame,
  scorePopStyle,
} from '../lib/animations';
import type {FootballColdOpenData, LeagueConfig, PaceEntry} from '../lib/types';

type FootballPaceCompositionProps = {
  variant: 'championship' | 'relegation';
  leagueName: string;
  titleLabel: string;
  subtitleLabel: string;
  benchmarkPercentage: number;
  benchmarkLabel: string;
  noteLabel?: string;
  entries: PaceEntry[];
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

const SAFE_AREA = {
  top: 64,
  left: 72,
  right: 176,
  bottom: 220,
};
const ROW_HEIGHT = 98;
const ROW_GAP = 12;
const HEADER_HOLD_GAP = 28;

export const FootballPaceComposition = ({
  variant,
  leagueName,
  titleLabel,
  subtitleLabel,
  benchmarkPercentage,
  benchmarkLabel,
  noteLabel,
  entries,
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
}: FootballPaceCompositionProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contentFrame =
    Math.max(0, frame - SHORT_OPENING_DURATION_FRAMES) + SHORT_MAIN_ENTRY_PREROLL_FRAMES;
  const competitionAccent = leagueConfig?.accentColor ?? '#F0A500';
  const titleColor = variant === 'relegation' ? '#E74C3C' : competitionAccent;
  const sortedEntries = [...entries].sort((left, right) => {
    if (right.percentage !== left.percentage) {
      return right.percentage - left.percentage;
    }

    if (right.points !== left.points) {
      return right.points - left.points;
    }

    return left.rank - right.rank;
  });
  const splitIndex =
    variant === 'championship'
      ? Math.max(sortedEntries.filter((entry) => entry.percentage >= benchmarkPercentage).length, 1)
      : Math.max(sortedEntries.filter((entry) => entry.percentage >= benchmarkPercentage).length, 1);
  const footerAnim = fadeInStyle(contentFrame, fps, footerStartFrame(entries.length + 1));
  const chipAnim = headerEntranceStyle(contentFrame, fps, 0);
  const titleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES);
  const subtitleAnim = headerEntranceStyle(contentFrame, fps, HEADER_STAGGER_FRAMES * 2);
  const accentWidth = accentWipeWidth(contentFrame);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: '#0b0d12',
        color: '#ffffff',
        fontFamily: TEASER_NUMBER_FONT,
      }}
    >
      <FootballShortFontFaces />
      <SoundtrackBed
        soundtrackPath={soundtrackPath}
        volume={soundtrackVolume}
        duckUntilSeconds={voiceoverPath ? 3.2 : 0}
      />
      <FootballShortBackdrop
        template={variant === 'relegation' ? 'relegation-line' : 'championship-pace'}
        variant={variant}
        accentColor={competitionAccent}
        opacity={0.5}
      />
      <FootballShortOpening
        template={variant === 'relegation' ? 'relegation-line' : 'championship-pace'}
        variant={variant}
        leagueName={leagueName}
        titleLabel={titleLabel}
        subtitleLabel={subtitleLabel}
        benchmarkPercentage={benchmarkPercentage}
        benchmarkLabel={benchmarkLabel}
        entries={sortedEntries}
        accentColor={competitionAccent}
        secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
      />

      <Sequence from={SHORT_OPENING_DURATION_FRAMES}>
        <VoiceoverBed voiceoverPath={voiceoverPath} />
        <CompetitionAccentRail
          accentColor={competitionAccent}
          secondaryAccentColor={leagueConfig?.secondaryAccentColor}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: accentWidth,
            height: 8,
            background: competitionAccent,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: `${SAFE_AREA.top}px ${SAFE_AREA.right}px ${SAFE_AREA.bottom}px ${SAFE_AREA.left}px`,
          }}
        >
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <div style={chipAnim}>
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 18px 8px',
                borderRadius: 999,
                background: '#0f1318',
                borderLeft: `8px solid ${competitionAccent}`,
                color: competitionAccent,
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
          </div>

          <div
            style={{
              fontSize: 84,
              lineHeight: 0.92,
              fontWeight: 900,
              fontFamily: TEASER_HEADLINE_FONT,
              letterSpacing: 0,
              textTransform: 'uppercase',
              color: titleColor,
              ...titleAnim,
            }}
          >
            {titleLabel}
          </div>

          <div
            style={{
              color: '#3a5060',
              fontSize: 46,
              lineHeight: 1,
              fontWeight: 600,
              fontFamily: TEASER_LABEL_FONT,
              textTransform: 'uppercase',
              ...subtitleAnim,
            }}
          >
            {subtitleLabel}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: ROW_GAP,
            marginTop: HEADER_HOLD_GAP,
          }}
        >
          {sortedEntries.slice(0, splitIndex).map((entry, index) => (
            <PaceRow
              key={`${entry.rank}-${entry.team}`}
              entry={entry}
              frame={contentFrame}
              fps={fps}
              rowIndex={index}
              benchmarkPercentage={benchmarkPercentage}
              variant={variant}
            />
          ))}
        </div>

        <BenchmarkDivider
          percentage={benchmarkPercentage}
          label={benchmarkLabel}
          variant={variant}
          leftInset={SAFE_AREA.left}
          frame={contentFrame}
          fps={fps}
          rowIndex={splitIndex}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: ROW_GAP,
            marginTop: 18,
            flex: 1,
          }}
        >
          {sortedEntries.slice(splitIndex).map((entry, index) => (
            <PaceRow
              key={`${entry.rank}-${entry.team}`}
              entry={entry}
              frame={contentFrame}
              fps={fps}
              rowIndex={splitIndex + 1 + index}
              benchmarkPercentage={benchmarkPercentage}
              variant={variant}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
            ...footerAnim,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {noteLabel?.trim() ? (
              <div
                style={{
                  color: '#c0ccd8',
                  fontFamily: '"Barlow", "Arial", sans-serif',
                  fontSize: 22,
                  lineHeight: 1.1,
                  fontWeight: 500,
                }}
              >
                {noteLabel}
              </div>
            ) : null}
            {ctaText?.trim() ? (
              <div
                style={{
                  maxWidth: 560,
                  padding: '16px 24px 14px',
                  borderRadius: 20,
                  background: '#0f1318',
                  border: `2px solid ${titleColor}`,
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
            ) : null}
          </div>
          <BrandMark brandName={brandName} brandLogoPath={brandLogoPath} />
        </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

const BenchmarkDivider = ({
  percentage,
  label,
  variant,
  leftInset,
  frame,
  fps,
  rowIndex,
}: {
  percentage: number;
  label: string;
  variant: 'championship' | 'relegation';
  leftInset: number;
  frame: number;
  fps: number;
  rowIndex: number;
}) => {
  const anim = entranceStyle(frame, fps, rowStartFrame(rowIndex));
  const color = variant === 'relegation' ? '#E74C3C' : '#F0A500';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
        paddingLeft: leftInset + 6,
        ...anim,
      }}
    >
      <div
        style={{
          flex: '0 0 190px',
          height: 3,
          borderRadius: 999,
          background: color,
        }}
      />
      <div
        style={{
          color: color,
          fontSize: 54,
          lineHeight: 1,
          fontWeight: 900,
          fontFamily: TEASER_NUMBER_FONT,
          minWidth: 120,
        }}
      >
        {percentage}%
      </div>
      <div
        style={{
          color: '#c0ccd8',
          fontFamily: '"Barlow", "Arial", sans-serif',
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const PaceRow = ({
  entry,
  frame,
  fps,
  rowIndex,
  benchmarkPercentage,
  variant,
}: {
  entry: PaceEntry;
  frame: number;
  fps: number;
  rowIndex: number;
  benchmarkPercentage: number;
  variant: 'championship' | 'relegation';
}) => {
  const anim = entranceStyle(frame, fps, rowStartFrame(rowIndex));
  const scoreAnim = scorePopStyle(frame, fps, rowStartFrame(rowIndex) + 3);
  const rowColor = getPerformanceColor(entry.percentage, benchmarkPercentage, variant);
  const fillWidth = `${Math.min(Math.max(entry.percentage, 12), 100)}%`;

  return (
    <div
      style={{
        position: 'relative',
        height: ROW_HEIGHT,
        borderRadius: 22,
        overflow: 'hidden',
        background: '#0f1318',
        border: '1px solid #1e2a34',
        ...anim,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: fillWidth,
          background: `linear-gradient(90deg, ${rowColor}EE, ${rowColor}88 70%, rgba(15,19,24,0.1))`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: rowColor,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          height: '100%',
          gap: 20,
          padding: '0 18px 0 22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            minWidth: 0,
          }}
        >
          <Badge badge={entry.badge} />
          <div
            style={{
              minWidth: 0,
              color: '#f0f4f8',
            }}
          >
            <div
              style={{
                minWidth: 0,
                fontSize: 34,
                lineHeight: 1,
                fontWeight: 800,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.team}
              {entry.hasGameInHand ? '*' : ''}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 128,
            padding: '16px 18px 14px',
            borderRadius: 18,
            background: '#0f1318',
            border: `2px solid ${rowColor}`,
            boxShadow: `0 0 22px ${rowColor}26`,
            color: '#ffffff',
            ...scoreAnim,
          }}
        >
          <div
            style={{
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 900,
              fontFamily: TEASER_NUMBER_FONT,
            }}
          >
            {entry.percentage}%
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({badge}: {badge: PaceEntry['badge']}) => {
  const imagePath = badge.logoPath ?? badge.imagePath;

  return imagePath ? (
    <Img
      src={staticFile(imagePath.replace(/^\//, ''))}
      style={{
        width: 52,
        height: 52,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 999,
        background: '#141c24',
        border: '1px solid #1e2a34',
        display: 'grid',
        placeItems: 'center',
        color: '#c0ccd8',
        fontFamily: '"Barlow", "Arial", sans-serif',
        fontSize: 18,
        lineHeight: 1,
        fontWeight: 700,
      }}
    >
      {badge.label}
    </div>
  );
};

const getPerformanceColor = (
  percentage: number,
  benchmarkPercentage: number,
  variant: 'championship' | 'relegation'
) => {
  if (variant === 'championship') {
    if (percentage >= benchmarkPercentage) return '#27AE60';
    if (percentage >= benchmarkPercentage - 14) return '#F0A500';
    return '#E74C3C';
  }

  if (percentage >= benchmarkPercentage) return '#27AE60';
  if (percentage >= benchmarkPercentage - 8) return '#F0A500';
  return '#E74C3C';
};

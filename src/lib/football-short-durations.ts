import shortDurationsConfig from '../../config/football-short-durations.json';

type ShortDurationsConfig = {
  opening?: {
    teaserFrames?: number;
    introFrames?: number;
  };
  defaultContentFrames?: number;
  contentFramesByComposition?: Record<string, number>;
};

const config = shortDurationsConfig as ShortDurationsConfig;

const positiveFrameCount = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;

export const FOOTBALL_SHORT_TEASER_FRAMES = positiveFrameCount(config.opening?.teaserFrames, 60);
export const FOOTBALL_SHORT_INTRO_FRAMES = positiveFrameCount(config.opening?.introFrames, 45);
export const FOOTBALL_SHORT_OPENING_FRAMES = FOOTBALL_SHORT_TEASER_FRAMES + FOOTBALL_SHORT_INTRO_FRAMES;
export const FOOTBALL_SHORT_DEFAULT_CONTENT_FRAMES = positiveFrameCount(config.defaultContentFrames, 345);

export const getFootballShortDurationInFrames = (compositionId: string) => {
  const contentFrames = positiveFrameCount(
    config.contentFramesByComposition?.[compositionId],
    FOOTBALL_SHORT_DEFAULT_CONTENT_FRAMES
  );

  return FOOTBALL_SHORT_OPENING_FRAMES + contentFrames;
};

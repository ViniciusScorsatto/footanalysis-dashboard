import {Sequence} from 'remotion';
import {FootballColdOpen} from './FootballColdOpen';
import {
  SHORT_INTRO_DURATION_FRAMES,
  SHORT_TEASER_DURATION_FRAMES,
} from './FootballShortTeaserKit';
import {
  FootballShortTeaser,
} from './FootballShortTeaser';
import type {FootballColdOpenData, TeamBadge} from '../lib/types';
import type {ComponentProps} from 'react';

export const SHORT_OPENING_DURATION_FRAMES =
  SHORT_TEASER_DURATION_FRAMES + SHORT_INTRO_DURATION_FRAMES;
export const SHORT_MAIN_ENTRY_PREROLL_FRAMES = 30;

type FootballShortOpeningProps = ComponentProps<typeof FootballShortTeaser> & {
  brandName: string;
  brandLogoPath?: string;
  introTitle?: string;
  introSubtitle?: string;
  hookText?: string;
  coldOpenData?: FootballColdOpenData;
  championBadge?: TeamBadge;
};

export const FootballShortOpening = ({
  brandName,
  brandLogoPath,
  introTitle,
  introSubtitle,
  hookText,
  coldOpenData,
  accentColor,
  secondaryAccentColor,
  ...teaserProps
}: FootballShortOpeningProps) => (
  <>
    <Sequence from={0} durationInFrames={SHORT_TEASER_DURATION_FRAMES}>
      <FootballShortTeaser
        {...teaserProps}
        accentColor={accentColor}
        secondaryAccentColor={secondaryAccentColor}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
      />
    </Sequence>
    <Sequence from={SHORT_TEASER_DURATION_FRAMES} durationInFrames={SHORT_INTRO_DURATION_FRAMES}>
      <FootballColdOpen
        accentColor={accentColor}
        secondaryAccentColor={secondaryAccentColor}
        brandName={brandName}
        brandLogoPath={brandLogoPath}
        introTitle={introTitle}
        introSubtitle={introSubtitle}
        hookText={hookText}
        coldOpenData={coldOpenData}
        template={teaserProps.template}
        variant={teaserProps.variant}
        startSettled
      />
    </Sequence>
  </>
);

import {AbsoluteFill} from 'remotion';
import {CompetitionAccentRail} from '../components/CompetitionAccentRail';
import {FootballShortFontFaces, TEASER_HEADLINE_FONT, TEASER_LABEL_FONT, TEASER_NUMBER_FONT} from '../components/FootballShortTeaserKit';
import {BrandMark} from '../components/BrandMark';
import {StandingsTable} from '../components/StandingsTable';
import {StandingsLegend} from '../components/StandingsLegend';
import {SoundtrackBed} from '../components/SoundtrackBed';
import type {FootballChannelProfile, LeagueConfig, SerieCQuadrangularGroup} from '../lib/types';

type Props = {
  channelProfile?: FootballChannelProfile;
  leagueName: string;
  standingsLabel: string;
  groups: SerieCQuadrangularGroup[];
  leagueConfig?: LeagueConfig;
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackVolume?: number;
  presentation?: 'animated' | 'static';
};

const quadrangularZones = () => [
  {
    key: 'finalistas-serie-b',
    label: 'Finalistas e Série B',
    start: 1,
    end: 1,
    fill: 'linear-gradient(90deg, rgba(46, 134, 222, 0.42), rgba(46, 134, 222, 0.10) 62%, rgba(0,0,0,0.04))',
    accent: '#2E86DE',
    textColor: '#2E86DE',
  },
  {
    key: 'serie-b',
    label: 'Série B',
    start: 2,
    end: 2,
    fill: 'linear-gradient(90deg, rgba(26, 188, 156, 0.34), rgba(26, 188, 156, 0.08) 62%, rgba(0,0,0,0.04))',
    accent: '#1ABC9C',
    textColor: '#1ABC9C',
  },
];

export const FootballSerieCQuadrangularComposition = ({
  channelProfile = 'pt', leagueName, standingsLabel, groups, leagueConfig, brandName, brandLogoPath,
  backgroundImagePath, soundtrackPath, soundtrackVolume = 0.2, presentation = 'static',
}: Props) => {
  const accentColor = leagueConfig?.accentColor ?? '#27AE60';
  const visibleGroups = groups
    .filter((group) => Array.isArray(group.rows) && group.rows.length)
    .slice(0, 2);
  return (
    <AbsoluteFill style={{overflow: 'hidden', color: '#fff', fontFamily: TEASER_NUMBER_FONT, background: '#0b0d12'}}>
      <FootballShortFontFaces />
      <SoundtrackBed soundtrackPath={soundtrackPath} volume={soundtrackVolume} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 24%, rgba(39,174,96,0.08), transparent 34%), #0b0d12'}} />
      <CompetitionAccentRail accentColor={accentColor} secondaryAccentColor={leagueConfig?.secondaryAccentColor} />
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: accentColor}} />
      <div style={{position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '54px 110px 112px 110px', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}><BrandMark brandName={brandName} brandLogoPath={brandLogoPath} /></div>
        <div style={{fontFamily: TEASER_LABEL_FONT, color: accentColor, fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', marginTop: 26}}>{leagueName}</div>
        <div style={{fontFamily: TEASER_HEADLINE_FONT, color: '#f0f4f8', fontSize: 70, lineHeight: 0.95, fontWeight: 900, textTransform: 'uppercase', marginTop: 14}}>Quadrangular</div>
        <div style={{fontFamily: TEASER_LABEL_FONT, color: '#8ca0ad', fontSize: 25, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 14}}>{standingsLabel}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0, marginTop: 30}}>
          {visibleGroups.map((group) => {
            const legacyGroup = group as SerieCQuadrangularGroup & {key?: string; label?: string};
            const groupKey = group.groupKey ?? legacyGroup.key ?? 'grupo';
            const groupLabel = group.groupLabel ?? legacyGroup.label ?? groupKey;
            return (
            <div key={groupKey} style={{display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '18px 18px 16px', background: '#0f1318', border: '1px solid #1e2a3a', borderRadius: 18}}>
              <div style={{fontFamily: TEASER_LABEL_FONT, color: '#f0f4f8', fontSize: 25, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12}}>{groupLabel}</div>
              <StandingsTable rows={group.rows} zones={quadrangularZones()} channelProfile={channelProfile} disableAnimation={presentation === 'static'} mode="serie-c-quadrangular" />
            </div>
          )})}
        </div>
        <StandingsLegend zones={quadrangularZones()} channelProfile={channelProfile} />
      </div>
    </AbsoluteFill>
  );
};

import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMark} from '../components/BrandMark';
import {FootballShortFontFaces, TeaserBackdrop, TEASER_HEADLINE_FONT, TEASER_LABEL_FONT, TEASER_NUMBER_FONT} from '../components/FootballShortTeaserKit';
import {headerEntranceStyle, scorePopStyle} from '../lib/animations';
import type {ShortVisualAsset, ShortVisualComposition, ShortVisualScene, ShortVisualText} from '../visual-short/types';

const backgroundForVariant = (variant: ShortVisualComposition['templateVariant']) =>
  variant === 'relegation' ? 'backgrounds/teaser-arena-perspective.png' : variant === 'championship' ? 'backgrounds/teaser-stadium-lights.png' : 'backgrounds/teaser-goal-pitch.png';

const TeamBadge = ({asset}: {asset: ShortVisualAsset}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 300}}>
    <div style={{width: 210, height: 210, display: 'grid', placeItems: 'center', borderRadius: 105, backgroundColor: 'rgba(11,13,18,.86)', border: `5px solid ${asset.accentColor ?? '#F0A500'}`, boxShadow: `0 0 0 12px rgba(240,165,0,.06), 0 18px 42px rgba(0,0,0,.5)`}}>
      {asset.logoPath ? <Img src={staticFile(asset.logoPath.replace(/^\//, ''))} style={{width: 154, height: 154, objectFit: 'contain'}} /> : <span style={{fontFamily: TEASER_NUMBER_FONT, fontSize: 62, color: '#F0A500'}}>{asset.name.slice(0, 2).toUpperCase()}</span>}
    </div>
    <span style={{fontFamily: TEASER_NUMBER_FONT, color: '#f0f4f8', fontSize: 30, fontWeight: 900, textAlign: 'center', maxWidth: 300}}>{asset.name.toUpperCase()}</span>
  </div>
);

const CompetitionBadge = ({composition}: {composition: ShortVisualComposition}) => {
  const logoPath = composition.metadata.competitionLogoPath ?? 'branding/competition-badge-brasileirao.svg';
  return <div style={{position: 'absolute', top: 92, right: 70, width: 126, height: 126, opacity: 0.98, filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.38))'}}><Img src={staticFile(logoPath.replace(/^\//, ''))} style={{width: '100%', height: '100%', objectFit: 'contain'}} /></div>;
};

const VisualText = ({item, frame, fps}: {item: ShortVisualText; frame: number; fps: number}) => {
  const entrance = headerEntranceStyle(frame, fps, 0, 28);
  const style = item.role === 'STAT' ? scorePopStyle(frame, fps, 4) : entrance;
  return <div style={{position: 'absolute', left: item.x, top: item.y, width: item.width, height: item.height, display: 'flex', alignItems: 'center', justifyContent: item.align === 'left' ? 'flex-start' : item.align === 'right' ? 'flex-end' : 'center', textAlign: item.align, color: item.color, fontFamily: item.fontFamily === 'Oxanium Teaser' ? TEASER_NUMBER_FONT : item.fontFamily === 'Audiowide Teaser' ? TEASER_LABEL_FONT : TEASER_HEADLINE_FONT, fontSize: item.fontSize, lineHeight: 1.06, fontWeight: item.role === 'HEADLINE' || item.role === 'STAT' ? 900 : 700, letterSpacing: item.role === 'LABEL' ? 1.2 : 0, textShadow: '0 4px 16px rgba(0,0,0,.72)', ...style}}>{item.text}</div>;
};

const MainVisual = ({scene, frame, fps}: {scene: ShortVisualScene; frame: number; fps: number}) => {
  const teams = scene.data.teams ?? [];
  return <>
    {teams.length > 0 && <div style={{position: 'absolute', left: 72, right: 72, top: 350, height: 360, display: 'flex', justifyContent: teams.length === 1 ? 'center' : 'space-between', alignItems: 'center', gap: 24, padding: '0 34px', borderRadius: 32, border: '1px solid rgba(240,165,0,.26)', background: 'linear-gradient(135deg, rgba(20,28,36,.94), rgba(11,13,18,.82))', boxShadow: '0 24px 70px rgba(0,0,0,.35)', opacity: interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
      {teams.slice(0, 2).map((asset) => <TeamBadge key={asset.name} asset={asset} />)}
      {teams.length > 1 && <div style={{position: 'absolute', left: '50%', top: 143, transform: 'translateX(-50%)', width: 74, height: 74, borderRadius: 37, display: 'grid', placeItems: 'center', backgroundColor: '#F0A500', color: '#0b0d12', fontFamily: TEASER_NUMBER_FONT, fontSize: 24, fontWeight: 950, boxShadow: '0 8px 24px rgba(240,165,0,.38)'}}>VS</div>}
    </div>}
    <div style={{position: 'absolute', left: 72, right: 72, top: 760, height: 4, background: 'linear-gradient(90deg, transparent, #F0A500, transparent)', opacity: 0.7}} />
    {scene.texts.map((item) => <VisualText key={`${scene.id}-${item.role}-${item.text}`} item={item} frame={frame} fps={fps} />)}
  </>;
};

export const FootballStoryShortComposition = ({composition}: {composition: ShortVisualComposition}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{backgroundColor: composition.colors.bg ?? '#0b0d12', color: composition.colors.white ?? '#f0f4f8', overflow: 'hidden'}}>
    <FootballShortFontFaces />
    <AbsoluteFill style={{opacity: 0.48}}><TeaserBackdrop backgroundPath={backgroundForVariant(composition.templateVariant)} accentColor={composition.colors.gold ?? '#F0A500'} intensity={0.72} /></AbsoluteFill>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 28%, rgba(240,165,0,.12), transparent 30%), linear-gradient(180deg, rgba(11,13,18,.12), rgba(11,13,18,.72) 70%, #0b0d12 100%)'}} />
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 18, backgroundColor: composition.colors.gold ?? '#F0A500'}} />
    <CompetitionBadge composition={composition} />
    <div style={{position: 'absolute', top: composition.safeAreas.top, left: composition.safeAreas.left, right: 240, display: 'flex', justifyContent: 'space-between', color: composition.colors.steel ?? '#3a5060', fontFamily: TEASER_LABEL_FONT, fontSize: 20, letterSpacing: 1}}>
      <span>{String(composition.metadata.competition ?? 'BRASILEIRÃO').toUpperCase()}</span><span>RODADA {composition.metadata.round ?? ''}</span>
    </div>
    {composition.scenes.map((scene) => <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames} layout="none"><MainVisual scene={scene} frame={frame - scene.from} fps={fps} /></Sequence>)}
    <div style={{position: 'absolute', bottom: composition.safeAreas.bottom, right: composition.safeAreas.right, transform: 'scale(.42)', transformOrigin: 'right bottom'}}><BrandMark brandName="Foot Analysis" brandLogoPath="/branding/foot-analysis-logo.png" /></div>
  </AbsoluteFill>;
};

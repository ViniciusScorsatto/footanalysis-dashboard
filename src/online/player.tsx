import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {ShortVideo, shortMetadata} from './ShortVideo';
import type {FootballVideoJob} from '../lib/types';

const root = createRoot(document.getElementById('player')!);
const show = (text: string) => root.render(<p style={{color: '#c0ccd8', padding: 20}}>{text}</p>);
show('Prepare um vídeo para visualizar.');
async function load() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  try {
    const response = await fetch(`/api/online/previews/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('Prévia indisponível. Entre novamente e prepare o vídeo.');
    const {job} = await response.json() as {job: FootballVideoJob};
    const metadata = shortMetadata(job);
    root.render(<Player component={ShortVideo} inputProps={{job}} durationInFrames={metadata.durationInFrames}
      fps={metadata.fps} compositionWidth={metadata.width} compositionHeight={metadata.height}
      controls clickToPlay doubleClickToFullscreen style={{width: '100%', maxHeight: '100dvh', aspectRatio: '9/16'}} />);
  } catch (error) {show(error instanceof Error ? error.message : 'Erro ao carregar prévia.');}
}
void load();

import {Composition, registerRoot} from 'remotion';
import {ShortVideo, shortMetadata} from './ShortVideo';
import type {FootballVideoJob} from '../lib/types';

const Root = () => <Composition
  id="OnlineShort"
  component={ShortVideo}
  width={1080}
  height={1920}
  fps={30}
  durationInFrames={300}
  defaultProps={{job: {} as FootballVideoJob}}
  calculateMetadata={({props}) => shortMetadata(props.job)}
/>;
registerRoot(Root);

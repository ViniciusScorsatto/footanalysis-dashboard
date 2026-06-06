import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {FootballPredictionsLongComposition} from './compositions/FootballPredictionsLongComposition';
import {FootballRoundSummaryLongComposition} from './compositions/FootballRoundSummaryLongComposition';
import type {
  FootballPredictionsLongVideoJob,
  FootballRoundSummaryLongVideoJob,
} from './lib/types';

type PreviewKind = 'predictions' | 'round-summary';

type LongformJob = FootballPredictionsLongVideoJob | FootballRoundSummaryLongVideoJob;

const previewConfig: Record<
  PreviewKind,
  {
    apiPath: string;
    component: React.ComponentType<{job: never}>;
    emptyLabel: string;
  }
> = {
  predictions: {
    apiPath: '/api/football/longform/options',
    component: FootballPredictionsLongComposition as React.ComponentType<{job: never}>,
    emptyLabel: 'Prepare a longform predictions job to preview it here.',
  },
  'round-summary': {
    apiPath: '/api/football/round-summary-longform/options',
    component: FootballRoundSummaryLongComposition as React.ComponentType<{job: never}>,
    emptyLabel: 'Prepare a round summary longform job to preview it here.',
  },
};

const getPreviewKind = (): PreviewKind => {
  const kind = new URLSearchParams(window.location.search).get('kind');
  return kind === 'predictions' ? 'predictions' : 'round-summary';
};

const isLongformJob = (value: unknown): value is LongformJob => {
  if (!value || typeof value !== 'object') return false;
  const job = value as {template?: unknown; durationInFrames?: unknown; matches?: unknown};
  return (
    (job.template === 'predictions-long' || job.template === 'round-summary-long') &&
    typeof job.durationInFrames === 'number' &&
    Array.isArray(job.matches)
  );
};

const LongformPreviewPlayer = () => {
  const kind = useMemo(getPreviewKind, []);
  const config = previewConfig[kind];
  const [job, setJob] = useState<LongformJob | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadJob = async () => {
      try {
        const response = await fetch(`${config.apiPath}?previewTs=${Date.now()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not load preview job.');
        }
        if (mounted) {
          setJob(isLongformJob(data.currentJob) ? data.currentJob : null);
          setError('');
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      }
    };

    void loadJob();
    return () => {
      mounted = false;
    };
  }, [config.apiPath]);

  if (error) {
    return <div className="preview-state">{error}</div>;
  }

  if (!job) {
    return <div className="preview-state">{config.emptyLabel}</div>;
  }

  const Component = config.component;

  return (
    <Player
      component={Component}
      inputProps={{job} as never}
      durationInFrames={Math.max(300, job.durationInFrames)}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      controls
      loop
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#050914',
      }}
    />
  );
};

createRoot(document.getElementById('root') as HTMLElement).render(<LongformPreviewPlayer />);

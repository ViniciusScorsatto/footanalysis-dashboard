export type ShortVisualTemplate =
  | 'RESULTADO_DESTAQUE'
  | 'CLASSIFICACAO_DESTAQUE'
  | 'SEQUENCIA'
  | 'ESTATISTICA_COMPARATIVA'
  | 'ARTILHARIA'
  | 'RESUMO_RODADA'
  | 'REBAIXAMENTO';

export type ShortVisualAsset = {
  name: string;
  logoPath?: string | null;
  accentColor?: string;
  sublabel?: string;
};

export type ShortVisualText = {
  text: string;
  role: 'HEADLINE' | 'SUBHEADLINE' | 'STAT' | 'LABEL' | 'CTA';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  color: string;
  fontFamily: string;
};

export type ShortVisualScene = {
  id: string;
  type: 'HOOK' | 'MAIN' | 'CONSEQUENCE' | 'CTA';
  from: number;
  durationInFrames: number;
  texts: ShortVisualText[];
  data: {
    template?: ShortVisualTemplate;
    teams?: ShortVisualAsset[];
    scoreline?: string | null;
  };
  transition: 'FADE_CURTO';
};

export type ShortVisualComposition = {
  id: string;
  contentId: string;
  template: ShortVisualTemplate;
  templateVariant: 'results' | 'championship' | 'relegation';
  resolution: {width: 1080; height: 1920; aspectRatio: '9:16'};
  width: 1080;
  height: 1920;
  fps: 30;
  durationInFrames: number;
  durationSeconds: number;
  scenes: ShortVisualScene[];
  assets: ShortVisualAsset[];
  safeAreas: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    center: {x: number; width: number};
  };
  animations: {entrance: 'SLIDE_FADE'; transition: 'FADE_CURTO'; stat: 'POP'};
  colors: Record<string, string>;
  metadata: {competition?: string; competitionLogoPath?: string; season?: number; round?: string; storyId?: string; sourceStoryType?: string};
  version: number;
  status: string;
};

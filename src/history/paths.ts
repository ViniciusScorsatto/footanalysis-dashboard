import path from 'node:path';

export const projectRoot = process.cwd();
export const historyDataDir = path.join(projectRoot, 'src', 'data', 'history');
export const historyCacheDir = path.join(historyDataDir, 'cache');
export const publicLogosDir = path.join(projectRoot, 'public', 'logos');
export const teamNameAliasesFile = path.join(projectRoot, 'config', 'football-team-name-aliases.json');
export const teamLogoOverridesFile = path.join(projectRoot, 'config', 'football-team-logo-overrides.json');
export const teamAccentColorsFile = path.join(projectRoot, 'config', 'football-team-accent-colors.json');

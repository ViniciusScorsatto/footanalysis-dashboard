import {sampleContinentalGroupsJob} from '../src/data/continentalGroups';
import {sampleSeasonFinalVerdictJob} from '../src/data/seasonFinalVerdict';
import {sampleChampionFinalJob} from '../src/data/championFinal';
import {sampleTopScorersJob} from '../src/data/topScorers';
import {samplePlayerOfRoundJob} from '../src/data/playerOfRound';
import {sampleChampionshipPaceJob, sampleRelegationLineJob} from '../src/data/pace';
import {sampleWorldCupGroupJob, sampleWorldCupKnockoutJob} from '../src/data/worldCup';
import {sampleHistoricalChampionsJob} from '../src/data/historyChampions';

const base = {sport:'football', compositionId:'FootballResultsShort', leagueId:71, season:2026,
  leagueName:'Verification', brandName:'Foot Analysis', durationInFrames:360,
  brandLogoPath:'/branding/foot-analysis-logo.png', soundtrackPath:'/audio/football/fun-vibe-dyalla.mp3'};
const rows = sampleWorldCupGroupJob.rows;
const fixtures = [{homeTeam:'Brazil',awayTeam:'Portugal',homeScore:2,awayScore:1,homeBadge:{label:'BRA'},awayBadge:{label:'POR'}}];
export const nations = {...sampleContinentalGroupsJob, leagueId:5,season:2026,leagueName:'UEFA Nations League',channelProfile:'en',languageProfile:'en',
  soundtrackPath:base.soundtrackPath,
  groups:Array.from({length:14},(_,i)=>({...sampleContinentalGroupsJob.groups[i%4],groupKey:`${'ABCD'[Math.floor(i/4)]}${i%4+1}`,groupLabel:`Group ${'ABCD'[Math.floor(i/4)]}${i%4+1}`}))};
export const jobs = [
  ...['results','next-games','predictions'].map(template=>({...base,template,roundLabel:'Matchday 1',fixtures})),
  {...base,template:'standings',standingsLabel:'Standings',rows},
  {...base,template:'serie-c-quadrangular',standingsLabel:'Segunda fase',groups:[{label:'Grupo A',rows},{label:'Grupo B',rows}]},
  sampleSeasonFinalVerdictJob,sampleChampionFinalJob,sampleTopScorersJob,samplePlayerOfRoundJob,
  sampleChampionshipPaceJob,sampleRelegationLineJob,sampleContinentalGroupsJob,
  sampleWorldCupGroupJob,sampleWorldCupKnockoutJob,sampleHistoricalChampionsJob,
  {...base,template:'tierlist',titleLabel:'Tierlist',subtitleLabel:'Season',tiers:[{key:'champion',label:'Champion',accentColor:'#00aaff',entries:[{team:'Brazil',badge:{label:'BRA'}}]}]},
  ...['team-comparison','league-comparison','top-scorers-comparison'].map(template=>({...base,template,titleLabel:'Comparison',subtitleLabel:'Season',
    comparisonContext:{metric:'goals',season:2026,source:'sqlite'},leftEntity:{label:'Brazil'},rightEntity:{label:'Portugal'},
    metrics:[{label:'Goals',leftValue:3,rightValue:2,winner:'left'}],rows:[]})),
  nations,
];

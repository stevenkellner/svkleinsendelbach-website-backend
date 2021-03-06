import DOMParser from 'dom-parser';

import { WebsiteFetcher } from '../../Fetchers/WebsiteFetcher';
import { HtmlNodeParser } from '../../NodeParser/HtmlNodeParser';
import { getImageId } from '../../Parameters/Parameters';
import { PersonParameters } from '../../Parameters/PersonParameters';
import { isPersonParameters } from '../../Parameters/PersonParameters.guard';
import { getTeamParameters } from '../../Parameters/TeamParameters';
import { DateOffset, DEFAULT_DATE_OFFSET } from '../../utils';
import { PersonStart } from './PersonStart';
import { isPersonStart } from './PersonStart.guard';

export class PersonStartParser implements WebsiteFetcher.Parser<PersonParameters, PersonStart> {
  public parametersGuard: (obj: any) => obj is PersonParameters = isPersonParameters;

  public getUrl(parameters: PersonParameters): string {
    return `http://www.anpfiff.info/sites/person/start.aspx?SK=${parameters.spielkreis}&Pers=${parameters.personId}`;
  }

  public readonly dateOffset: DateOffset = DEFAULT_DATE_OFFSET;

  public interfaceGuard: (obj: any) => obj is PersonStart = isPersonStart;

  public parseWebsite(dom: DOMParser.Dom): PersonStart {
    const parser = new HtmlNodeParser(dom);
    const imageId = getImageId(parser.byId('ctl00_cphO__ctrl_1_imgPerson').attribute('src'));
    const name = parser.byId('ctl00_cphO__ctrl_1_lblName').stringValue;
    const properties: { [key: string]: any | undefined } = {};
    parser
      .byId('ctl00_cphR__ctrl_3_divSteckbriefIH')
      .byClassAt('div-snp', 0)
      .children.forEach(node => {
        switch (node.childAt(0).textContent) {
          case 'Alter':
            properties.age = node.childAt(1).numberValue;
            break;
          case 'Nation':
            properties.nationFlagId = getImageId(node.childAt(1).childAt(0).childAt(0).attribute('src'));
            properties.nation = node.childAt(1).childAt(1).stringValue;
            break;
          case 'Starker Fuß':
            properties.strongFoot = node.childAt(1).stringValue;
            break;
          case 'Lieb.-Position':
            properties.favoritePosition = node.childAt(1).stringValue;
            break;
        }
      });
    const carrier = parser.byId('ctl00_cphR__ctrl_3_divSpielerKarriereIH').byClassAt('row-snp', 0).getZahlenProperties({
      totalGames: 'Spiele',
      gamesWon: 'Spiele gewonnen',
      gamesDraw: 'Spiele unentschieden',
      gamesLost: 'Spiele verloren',
      totalGoals: 'Tore gesamt',
      totalTeams: 'Vereine',
      totalAscents: 'Aufstiege',
      totalDescents: 'Abstiege',
    });
    const playerStations = parser
      .byId('ctl00_cphR__ctrl_3_divSpielerStationenIH')
      .byClassAt('div-snp', 0)
      .children.map(node => {
        return {
          season: node.childAt(0).stringValue,
          teamIconId: getImageId(node.childAt(1).childAt(0).attribute('src')),
          teamName: node.childAt(2).textContent,
          teamParameters: getTeamParameters(node.childAt(2).childAt(0).attribute('href')),
          league: node.childAt(3).stringValue,
          ascentDescent: node.childAt(4).childAt(0).attribute('title'),
        };
      });
    const transfers = parser
      .byId('ctl00_cphR__ctrl_3_divSpielerTransfersIH')
      .byClassAt('div-snp', 0)
      .children.map(node => {
        return {
          date: node.childAt(0).stringValue,
          fromIconId: getImageId(node.childAt(1).childAt(0).childAt(1).childAt(0).attribute('src')),
          fromName: node.childAt(1).childAt(0).childAt(2).stringValue,
          toIconId: getImageId(node.childAt(1).childAt(1).childAt(1).childAt(0).attribute('src')),
          toName: node.childAt(1).childAt(1).childAt(2).stringValue,
        };
      });
    const seasonResults = parser
      .byId('ctl00_cphR__ctrl_3_divSpielerSaisonbilanzIH')
      .byClassAt('div-snp', 0)
      .children.slice(1, -1)
      .map(node => {
        return {
          season: node.childAt(0).stringValue,
          teamName: node.childAt(2).childAt(1).stringValue,
          teamParameters: getTeamParameters(node.childAt(2).childAt(1).attribute('href')),
          games: node.childAt(3).intValue,
          goals: node.childAt(4).intValue,
          assists: node.childAt(5).intValue,
          substitutionsIn: node.childAt(6).intValue,
          substitutionsOut: node.childAt(7).intValue ?? ('R' as number | 'R' | undefined),
          yellowRedCards: node.childAt(8).intValue,
          redCards: node.childAt(9).intValue,
        };
      });
    const coachStations = parser
      .byId('ctl00_cphR__ctrl_3_divTrainerStationenIH')
      .byClassAt('div-snp', 0)
      .children.map(node => {
        return {
          season: node.childAt(0).stringValue,
          teamIconId: getImageId(node.childAt(1).childAt(0).attribute('src')),
          teamName: node.childAt(2).textContent,
          teamParameters: getTeamParameters(node.childAt(2).childAt(0).attribute('href')),
          league: node.childAt(3).stringValue,
        };
      });
    return {
      imageId: imageId,
      name: name,
      properties: properties,
      carrier: carrier,
      playerStations: playerStations,
      transfers: transfers,
      seasonResults: seasonResults,
      coachStations: coachStations,
    };
  }
}

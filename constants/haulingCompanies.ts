export interface HaulingCompany {
  id: string;
  name: string;
  logo: string;
}

export const HAULING_COMPANIES: HaulingCompany[] = [
  {
    id: 'gmi',
    name: 'GMI Services',
    logo: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dzanccm5jehctoikd1sdg',
  },
  {
    id: 'region',
    name: 'Region Services',
    logo: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/sji9cdn2idmxjy87ciqsk',
  },
];

export const DEFAULT_COMPANY = HAULING_COMPANIES[0];

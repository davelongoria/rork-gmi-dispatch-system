export interface HaulingCompany {
  id: string;
  name: string;
  logo: string;
}

export const HAULING_COMPANIES: HaulingCompany[] = [
  {
    id: 'gmi',
    name: 'GMI Services',
    logo: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/oyj3m5u65zt7k8zmjblq2',
  },
  {
    id: 'region',
    name: 'Region Services',
    logo: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/g9zr65a3y8hkw4y6vla5u',
  },
];

export const DEFAULT_COMPANY = HAULING_COMPANIES[0];

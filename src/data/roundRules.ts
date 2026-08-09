import type { RoundKey } from '../types';

export interface RoundRuleSet {
  title: string;
  subtitle: string;
  rules: string[];
}

export const roundRules: Partial<Record<RoundKey, RoundRuleSet>> = {
  round1: {
    title: 'Round 1',
    subtitle: 'Picture Question',
    rules: [
      'દરેક સાચા જવાબ માટે ૧૫ ગુણ મળશે.',
      'દરેક પ્રશ્ન માટે ૩૦ સેકન્ડનો સમય આપવામાં આવશે.',
      'ચિત્ર જોઈને સાચો જવાબ ઓળખવાનો રહેશે.',
      'જવાબ જોવા માટે "Reveal Answer" દબાવો.',
    ],
  },
  round2: {
    title: 'Round 2',
    subtitle: 'Multiple Choice Challenge',
    rules: [
      'દરેક સાચા જવાબ માટે ૧૦ ગુણ મળશે.',
      'આપેલા વિકલ્પોમાંથી એક જ વિકલ્પ પસંદ કરવો રહેશે.',
      'સમયમર્યાદા ધ્યાનમાં રાખવી.',
    ],
  },
};


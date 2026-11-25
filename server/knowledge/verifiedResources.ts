import type { VerifiedResource } from '../../src/types/herbiz.ts';

/**
 * Verified official Indian government, regulatory, and institutional portals.
 * Every URL below has been verified. Do NOT invent benefit amounts, eligibility rules,
 * or application deadlines — direct users to verify current terms on each official portal.
 */
export const VERIFIED_RESOURCES: VerifiedResource[] = [
  {
    id: 'msme-ministry',
    title: 'Ministry of MSME — Official Portal',
    organization: 'Ministry of Micro, Small & Medium Enterprises, Government of India',
    category: 'official_government_support',
    categoryLabel: 'Official Government Support',
    description:
      'Central portal for national MSME policies, official notices, and links to ministry programmes and state offices.',
    url: 'https://msme.gov.in/',
    note: 'Check official ministry circulars and current scheme notices directly on this portal.',
  },
  {
    id: 'myscheme-portal',
    title: 'myScheme — Government Schemes Discovery Portal',
    organization: 'National e-Governance Division (NeGD), Government of India',
    category: 'official_government_support',
    categoryLabel: 'Official Government Support',
    description:
      'Official government platform to search central and state welfare and business schemes and view official eligibility criteria.',
    url: 'https://www.myscheme.gov.in/',
    note: 'Use the official portal questionnaire to check current scheme rules and deadlines.',
  },
  {
    id: 'wep-niti-aayog',
    title: 'Women Entrepreneurship Platform (WEP)',
    organization: 'NITI Aayog, Government of India',
    category: 'official_government_support',
    categoryLabel: 'Official Government Support',
    description:
      'National aggregator platform built to connect women entrepreneurs in India with information, mentorship, and ecosystem support.',
    url: 'https://wep.gov.in/',
    note: 'Review current partner programmes and registration steps directly on WEP.',
  },
  {
    id: 'gem-portal',
    title: 'Government e-Marketplace (GeM)',
    organization: 'Ministry of Commerce & Industry, Government of India',
    category: 'official_government_support',
    categoryLabel: 'Official Government Support',
    description:
      'Official public procurement portal where registered micro and small sellers can explore supplying goods and services to government buyers.',
    url: 'https://gem.gov.in/',
    note: 'Check current seller onboarding documents and category requirements on GeM.',
  },
  {
    id: 'udyam-registration',
    title: 'Udyam Registration Portal',
    organization: 'Ministry of MSME, Government of India',
    category: 'business_registration',
    categoryLabel: 'Business Registration',
    description:
      'Official online, paperless portal for micro, small, and medium enterprise registration using Aadhaar and PAN details.',
    url: 'https://udyamregistration.gov.in/',
    note: 'Official registration on this portal is free of cost; verify instructions only on .gov.in.',
  },
  {
    id: 'startup-india',
    title: 'Startup India Portal',
    organization: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
    category: 'business_registration',
    categoryLabel: 'Business Registration',
    description:
      'Official portal for startup recognition information, criteria, state policies, and ecosystem directories.',
    url: 'https://www.startupindia.gov.in/',
    note: 'Review official DPIIT recognition criteria (https://www.startupindia.gov.in/content/sih/en/startup-scheme.html) before applying.',
  },
  {
    id: 'startup-india-schemes',
    title: 'Startup India — Government Schemes Directory',
    organization: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
    category: 'official_government_support',
    categoryLabel: 'Official Government Support',
    description:
      'Official central-government startup schemes and initiatives directory categorised by finance, incubation, market access, and mentoring.',
    url: 'https://www.startupindia.gov.in/content/sih/en/government-schemes.html',
    note: 'Consult each scheme’s official implementing page for current dates, eligibility, and documents.',
  },
  {
    id: 'ondc-network',
    title: 'Open Network for Digital Commerce (ONDC)',
    organization: 'ONDC (Section 8 Initiative supported by DPIIT)',
    category: 'business_registration',
    categoryLabel: 'Business Registration',
    description:
      'Open digital commerce network connecting local sellers and small merchants with buyer apps across India.',
    url: 'https://ondc.org/',
    note: 'Explore listed seller network participants and onboarding steps on the official site.',
  },
  {
    id: 'jansamarth-portal',
    title: 'JanSamarth — Credit-Linked Schemes Portal',
    organization: 'Ministry of Finance, Government of India',
    category: 'finance',
    categoryLabel: 'Finance',
    description:
      'Official national portal linking borrowers and lenders for government credit-linked schemes, including MUDRA and Stand-Up India pathways.',
    url: 'https://www.jansamarth.in/',
    note: 'Verify current lender requirements, documentation, and scheme terms directly on JanSamarth.',
  },
  {
    id: 'standup-india',
    title: 'Stand-Up India Portal (StandUp Mitra)',
    organization: 'Small Industries Development Bank of India (SIDBI) / DFS',
    category: 'finance',
    categoryLabel: 'Finance',
    description:
      'Official portal offering information and handholding support for women and SC/ST entrepreneurs setting up greenfield enterprises.',
    url: 'https://www.standupmitra.in/',
    note: 'Confirm current eligibility, greenfield definitions, and participating bank branch details on the portal.',
  },
  {
    id: 'udyamimitra-portal',
    title: 'Udyami Mitra Portal',
    organization: 'SIDBI (Small Industries Development Bank of India)',
    category: 'finance',
    categoryLabel: 'Finance',
    description:
      'Official SIDBI portal designed to improve access to credit and handholding agencies for micro and small enterprises.',
    url: 'https://www.udyamimitra.in/',
    note: 'Never share bank PINs or OTPs; complete applications only through official portals or bank branches.',
  },
  {
    id: 'sidbi-official',
    title: 'SIDBI — Official Website',
    organization: 'Small Industries Development Bank of India',
    category: 'finance',
    categoryLabel: 'Finance',
    description:
      'Principal financial institution focused on the promotion, financing, and development of India’s MSME sector.',
    url: 'https://www.sidbi.in/',
    note: 'Check official announcements and partner institution directories on SIDBI.',
  },
  {
    id: 'dfs-finance',
    title: 'Department of Financial Services (DFS)',
    organization: 'Ministry of Finance, Government of India',
    category: 'finance',
    categoryLabel: 'Finance',
    description:
      'Official government ministry department overseeing banking, financial inclusion, and credit scheme policy updates.',
    url: 'https://financialservices.gov.in/',
    note: 'Refer to official policy circulars for authoritative financial scheme updates.',
  },
  {
    id: 'skill-india-digital',
    title: 'Skill India Digital Hub (SIDH)',
    organization: 'Ministry of Skill Development & Entrepreneurship, Government of India',
    category: 'training_and_mentorship',
    categoryLabel: 'Training & Mentorship',
    description:
      'Official national platform offering free and certified digital skill courses, entrepreneurship modules, and vocational training directories.',
    url: 'https://www.skillindiadigital.gov.in/',
    note: 'Browse current online and local training courses directly on Skill India Digital Hub.',
  },
  {
    id: 'wep-mentorship',
    title: 'WEP Learning & Mentorship Resources',
    organization: 'NITI Aayog Women Entrepreneurship Platform',
    category: 'training_and_mentorship',
    categoryLabel: 'Training & Mentorship',
    description:
      'Dedicated resources, workshops, and peer mentorship pathways curated for aspiring and growing women founders in India.',
    url: 'https://wep.gov.in/',
    note: 'Check active cohorts and mentorship schedules on the official WEP portal.',
  },
  {
    id: 'startup-india-learning',
    title: 'Startup India Learning Programme',
    organization: 'DPIIT, Government of India',
    category: 'training_and_mentorship',
    categoryLabel: 'Training & Mentorship',
    description:
      'Free foundational learning modules on business planning, legal basics, finance, and marketing for early-stage founders.',
    url: 'https://www.startupindia.gov.in/',
    note: 'Access official learning programmes directly through the Startup India website.',
  },
];

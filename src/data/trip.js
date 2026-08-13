// Real trip data for "Baby Moon in the Mountains" — ported from the
// Claude Design prototype (Around the world - Travel App.dc.html),
// which itself was built from uploads/babymoon-itinerary.html.

export const INK = '#1c1b19';
export const TERRA = '#c96f3f';
export const BONE = '#faf8f4';
export const SAGE = '#6b8f5a';
export const BLUE = '#3f6f8f';
export const PLUM = '#8a6a9f';
export const GOLD = '#b08d4f';

export const TRAVELERS = [
  { name: 'Rodolfo', initial: 'R', color: TERRA },
  { name: 'Kirsten', initial: 'K', color: BLUE },
];

export const TRIP = {
  title: 'Baby Moon in the Mountains',
  range: 'Aug 21 – Sep 6',
  rangeLong: 'Aug 21 – Sep 6, 2026',
  days: 17,
  route: 'SJD → MEX → LHR → MUC → LHR → MEX → SJD',
};

export const DAYS = [
  {
    dow: 'Fri', num: '21', mon: 'Aug',
    label: 'Friday, August 21 · Mexico City (transit)', short: 'Fri Aug 21', tag: 'Travel day',
    transit: [
      { t: 'Aeroméxico AM379', s: 'SJD 06:15 → MEX 09:30', night: false, bk: 0 },
      { t: 'British Airways BA0242', s: 'MEX 22:00 → LHR 15:30 +1 · overnight', night: true, bk: 1 },
    ],
    parts: { morning: 'Early morning flight from SJD to MEX', afternoon: 'Working remotely from the airport', evening: 'Flight to London' },
    overnight: 'In flight (overnight to London)',
  },
  {
    dow: 'Sat', num: '22', mon: 'Aug',
    label: 'Saturday, August 22 · London', short: 'Sat Aug 22', tag: 'Arrival',
    transit: [{ t: 'Arrive LHR 15:30', s: 'from the overnight flight', night: true, bk: 1 }],
    parts: { morning: 'Long-haul flight', afternoon: 'Arrival at flat', evening: 'Dinner with Mark, Mayra, Yvonne and Greg at Dishoom' },
    overnight: 'London flat',
  },
  {
    dow: 'Sun', num: '23', mon: 'Aug',
    label: 'Sunday, August 23 · London', short: 'Sun Aug 23', tag: 'Open',
    transit: [],
    parts: { morning: 'Spending time with David — activities TBD', afternoon: 'Spending time with David — activities TBD' },
    overnight: 'London flat',
  },
  {
    dow: 'Mon', num: '24', mon: 'Aug',
    label: 'Monday, August 24 · Munich → Austria', short: 'Mon Aug 24', tag: 'Travel day',
    transit: [
      { t: 'Car pickup from flat', s: '04:20 → Heathrow', night: false, bk: 2 },
      { t: 'British Airways BA0926', s: 'LHR 07:10 → MUC 10:05', night: false, bk: 3 },
      { t: 'Sixt car pickup', s: 'Munich Airport, 11:30', night: false, bk: 4 },
    ],
    parts: {
      morning: 'Travelling — flight to Munich, then car pickup at the airport',
      afternoon: "Eagle's Nest (Kehlsteinhaus) — lunch/meal at the summit",
      evening: 'Drive on to Kitzbühel, check in at Grand Tirolia',
    },
    overnight: 'Grand Tirolia, Kitzbühel',
  },
  {
    dow: 'Tue', num: '25', mon: 'Aug',
    label: 'Tuesday, August 25 · Austria', short: 'Tue Aug 25', tag: 'Kitzbühel',
    transit: [],
    parts: { morning: 'Golf — 8:00 AM tee time', afternoon: 'Spa afternoon at the hotel', evening: 'At the hotel' },
    overnight: 'Grand Tirolia, Kitzbühel',
  },
  {
    dow: 'Wed', num: '26', mon: 'Aug',
    label: 'Wednesday, August 26 · Austria', short: 'Wed Aug 26', tag: 'Day trip',
    transit: [],
    parts: {
      morning: 'Day trip to Vorderer Gosausee',
      afternoon: 'Possible climb up to Dachstein Skywalk (weather/time permitting)',
      evening: 'Return to hotel — spa',
    },
    overnight: 'Grand Tirolia, Kitzbühel',
  },
  {
    dow: 'Thu', num: '27', mon: 'Aug',
    label: 'Thursday, August 27 · Austria', short: 'Thu Aug 27', tag: 'Kitzbühel',
    transit: [],
    parts: { morning: 'Hotel/Spa', afternoon: 'Golf — 3:00 PM tee time', evening: 'Hotel/Spa' },
    overnight: 'Grand Tirolia, Kitzbühel',
  },
  {
    dow: 'Fri', num: '28', mon: 'Aug',
    label: 'Friday, August 28 · Munich → London', short: 'Fri Aug 28', tag: 'Travel day',
    transit: [
      { t: 'Sixt car return', s: 'Munich Airport, 17:00', night: false, bk: 4 },
      { t: 'British Airways BA0937', s: 'MUC 20:50 → LHR 21:45', night: false, bk: 5 },
      { t: 'Car pickup at Heathrow', s: 'flight-tracked · 45 min free wait', night: false, bk: 6 },
    ],
    parts: { afternoon: 'Depart Kitzbühel hotel ~14:30 for the drive to Munich Airport' },
    overnight: 'London flat',
  },
  {
    dow: 'Sat', num: '29', mon: 'Aug',
    label: 'Saturday, August 29 · London', short: 'Sat Aug 29', tag: 'Appointment',
    transit: [],
    parts: { morning: 'Neko Health Body Scan — check-in 10:20, appointment 10:30–11:30, Neko Health Covent Garden, 1 Endell St, WC2H 9BB' },
    overnight: 'London flat',
  },
  { dow: 'Sun', num: '30', mon: 'Aug', label: 'Sunday, August 30 · London', short: 'Sun Aug 30', tag: 'Empty', transit: [], parts: {}, overnight: 'London flat' },
  { dow: 'Mon', num: '31', mon: 'Aug', label: 'Monday, August 31 · London', short: 'Mon Aug 31', tag: 'Empty', transit: [], parts: {}, overnight: 'London flat' },
  { dow: 'Tue', num: '01', mon: 'Sep', label: 'Tuesday, September 1 · London', short: 'Tue Sep 1', tag: 'Empty', transit: [], parts: {}, overnight: 'London flat' },
  { dow: 'Wed', num: '02', mon: 'Sep', label: 'Wednesday, September 2 · London', short: 'Wed Sep 2', tag: 'Empty', transit: [], parts: {}, overnight: 'London flat' },
  { dow: 'Thu', num: '03', mon: 'Sep', label: 'Thursday, September 3 · London', short: 'Thu Sep 3', tag: 'Empty', transit: [], parts: {}, overnight: 'London flat' },
  {
    dow: 'Fri', num: '04', mon: 'Sep',
    label: 'Friday, September 4 · Mexico City', short: 'Fri Sep 4', tag: 'Travel day',
    transit: [
      { t: 'British Airways BA0243', s: 'LHR 15:10 → MEX 19:45', night: false, bk: 7 },
      { t: 'Taxi to INNSiDE Roma Norte', s: '19:45 · included', night: false, bk: 8 },
    ],
    parts: { morning: 'Travelling', afternoon: 'Travelling', evening: 'Check-in to the hotel' },
    overnight: 'INNSiDE by Meliá, Mexico City',
  },
  {
    dow: 'Sat', num: '05', mon: 'Sep',
    label: 'Saturday, September 5 · Mexico City', short: 'Sat Sep 5', tag: 'Roma Norte',
    transit: [],
    parts: { morning: 'Eat', afternoon: 'Eat', evening: 'Eat' },
    overnight: 'INNSiDE by Meliá, Mexico City',
  },
  {
    dow: 'Sun', num: '06', mon: 'Sep',
    label: 'Sunday, September 6 · Los Cabos', short: 'Sun Sep 6', tag: 'Home',
    transit: [
      { t: 'Car pickup from hotel', s: '07:50 → MEX Airport', night: false, bk: 9 },
      { t: 'Aeroméxico AM382', s: 'MEX 10:50 → SJD 12:18', night: false, bk: 10 },
    ],
    parts: { morning: 'Flight to Los Cabos', afternoon: 'Unpack', evening: 'Rest' },
    overnight: 'Home (Los Cabos)',
  },
];

// Every day in the itinerary file is written as "21 Aug"/"04 Sep" rather
// than a real date — stamp an ISO date onto each one (trip is fixed to
// 2026) so date math (countdown, "is this day live") works generically.
const TRIP_YEAR = 2026;
const MONTH_NUM = { Aug: '08', Sep: '09' };
DAYS.forEach((d) => { d.iso = `${TRIP_YEAR}-${MONTH_NUM[d.mon]}-${d.num}`; });

export const BOOKINGS = [
  {
    kind: 'Flight', group: 'Flights', status: 'Confirmed', title: 'Aeroméxico AM379', date: '2026-08-21',
    sub: 'Los Cabos → Mexico City · Fri Aug 21 · Business, 2 passengers',
    price: 'MX$12,254', ref: 'GXUQKV', who: 'Round trip with AM382',
    detail: {
      leftLabel: 'Depart', leftValue: 'SJD', leftSub: '06:15 · T1',
      rightLabel: 'Arrive', rightValue: 'MEX', rightSub: '09:30 · T2',
      rows: [{ k: 'Flight', v: 'AM379' }, { k: 'Cabin', v: 'Business' }, { k: 'Passengers', v: '2' }, { k: 'Confirmation', v: 'GXUQKV' }],
      note: 'Baggage allowance not specified in the confirmation email. Business normally includes checked bags — worth confirming with Aeroméxico if travelling heavy.',
    },
  },
  {
    kind: 'Flight', group: 'Flights', status: 'Overnight', title: 'British Airways BA0242', date: '2026-08-22',
    sub: 'Mexico City → London Heathrow · Fri Aug 21 → Sat Aug 22 · World Traveller Plus',
    price: 'MX$46,472', ref: 'YGKCWZ', who: 'Round trip with BA0243',
    detail: {
      leftLabel: 'Depart', leftValue: 'MEX', leftSub: '22:00 · T1',
      rightLabel: 'Arrive', rightValue: 'LHR', rightSub: '15:30 +1 · T5',
      rows: [{ k: 'Cabin', v: 'World Traveller Plus' }, { k: 'Passengers', v: '2' }, { k: 'Baggage', v: '2 × 23 kg each' }, { k: 'Confirmation', v: 'YGKCWZ' }],
      note: 'Terminal change at MEX — AM379 lands at Terminal 2, this departs Terminal 1. Plenty of time (09:30 → 22:00), but note the transfer.',
    },
  },
  {
    kind: 'Ground', group: 'Ground', status: 'Confirmed', title: 'Booking.com Rides — Standard car', date: '2026-08-24',
    sub: 'SW9 0JP Clapham Rd → Heathrow · Mon Aug 24, 04:20 pickup',
    price: '£63.10', ref: '703464020', who: '247 Airport Transfer',
    detail: {
      leftLabel: 'Pickup', leftValue: '04:20', leftSub: 'SW9 0JP',
      rightLabel: 'Drop', rightValue: 'LHR', rightSub: 'Terminal 5',
      rows: [{ k: 'Operator', v: '247 Airport Transfer' }, { k: 'Passengers', v: 'Max 2' }, { k: 'Driver waits', v: '15 min' }, { k: 'Ride', v: '786131230' }],
    },
  },
  {
    kind: 'Flight', group: 'Flights', status: 'Confirmed', title: 'British Airways BA0926', date: '2026-08-24',
    sub: 'Heathrow T5 → Munich T1 · Mon Aug 24 · Euro Traveller',
    price: '£373.00', ref: 'Y47V94', who: 'Round trip with BA0937',
    detail: {
      leftLabel: 'Depart', leftValue: 'LHR', leftSub: '07:10 · T5',
      rightLabel: 'Arrive', rightValue: 'MUC', rightSub: '10:05 · T1',
      rows: [{ k: 'Cabin', v: 'Euro Traveller' }, { k: 'Passengers', v: '2' }, { k: 'Cabin bags', v: '1 handbag + 1 cabin bag' }, { k: 'Checked', v: '1 × 23 kg each' }],
    },
  },
  {
    kind: 'Car', group: 'Car', status: 'Confirmed', title: 'Sixt — Premium Elite Sedan', date: '2026-08-28',
    sub: 'Munich Airport · Aug 24, 11:30 → Aug 28, 17:00',
    price: '€363.34', ref: '9737571910', who: 'BMW 5 / Audi A6 / Merc E or similar',
    detail: {
      leftLabel: 'Pickup', leftValue: 'Aug 24', leftSub: '11:30 · MUC',
      rightLabel: 'Return', rightValue: 'Aug 28', rightSub: '17:00 · MUC',
      rows: [{ k: 'Vehicle', v: 'Automatic · 5 seats' }, { k: 'Included', v: 'Basic protection, cross-border, navigation' }, { k: 'Confirmation', v: '9737571910' }],
    },
  },
  {
    kind: 'Flight', group: 'Flights', status: 'Confirmed', title: 'British Airways BA0937', date: '2026-08-28',
    sub: 'Munich T1 → Heathrow T5 · Fri Aug 28 · Euro Traveller',
    price: 'incl. Y47V94', ref: 'Y47V94', who: 'Return of BA0926',
    detail: {
      leftLabel: 'Depart', leftValue: 'MUC', leftSub: '20:50 · T1',
      rightLabel: 'Arrive', rightValue: 'LHR', rightSub: '21:45 · T5',
      rows: [{ k: 'Cabin', v: 'Euro Traveller' }, { k: 'Passengers', v: '2' }, { k: 'Cabin bags', v: '1 handbag + 1 cabin bag' }, { k: 'Checked', v: '1 × 23 kg each' }],
    },
  },
  {
    kind: 'Ground', group: 'Ground', status: 'Confirmed', title: 'Booking.com Rides — Electric Standard', date: '2026-08-28',
    sub: 'Heathrow → SW9 0JP Clapham Rd · Fri Aug 28, from 21:45 landing',
    price: '£66.42', ref: '304126009', who: '247 Airport Transfer',
    detail: {
      leftLabel: 'Pickup', leftValue: 'LHR', leftSub: 'after landing',
      rightLabel: 'Drop', rightValue: 'SW9', rightSub: 'Clapham Rd',
      rows: [{ k: 'Operator', v: '247 Airport Transfer' }, { k: 'Flight-tracked', v: 'BA937' }, { k: 'Free wait', v: '45 min after landing' }, { k: 'Ride', v: '480640702' }],
    },
  },
  {
    kind: 'Flight', group: 'Flights', status: 'Confirmed', title: 'British Airways BA0243', date: '2026-09-04',
    sub: 'Heathrow T5 → Mexico City T1 · Fri Sep 4 · World Traveller Plus',
    price: 'incl. YGKCWZ', ref: 'YGKCWZ', who: 'Return of BA0242',
    detail: {
      leftLabel: 'Depart', leftValue: 'LHR', leftSub: '15:10 · T5',
      rightLabel: 'Arrive', rightValue: 'MEX', rightSub: '19:45 · T1',
      rows: [{ k: 'Cabin', v: 'World Traveller Plus' }, { k: 'Passengers', v: '2' }, { k: 'Baggage', v: '2 × 23 kg each' }, { k: 'Confirmation', v: 'YGKCWZ' }],
    },
  },
  {
    kind: 'Ground', group: 'Ground', status: 'Included', title: 'Booking.com taxi — MEX to hotel', date: '2026-09-04',
    sub: 'MEX Airport → INNSiDE Roma Norte · Fri Sep 4, 19:45',
    price: 'Included', ref: '356467129', who: 'No cost',
    detail: {
      leftLabel: 'Pickup', leftValue: '19:45', leftSub: 'MEX T1',
      rightLabel: 'Drop', rightValue: 'Hotel', rightSub: 'Roma Norte',
      rows: [{ k: 'Cost', v: 'Included at no cost' }, { k: 'Confirmation', v: '356467129' }],
    },
  },
  {
    kind: 'Ground', group: 'Ground', status: 'Confirmed', title: 'Booking.com Rides — People Carrier', date: '2026-09-06',
    sub: 'INNSiDE Roma Norte → MEX Airport · Sun Sep 6, 07:50 pickup',
    price: '£26.00', ref: '672474128', who: 'E-Life Limo',
    detail: {
      leftLabel: 'Pickup', leftValue: '07:50', leftSub: 'Hotel',
      rightLabel: 'Drop', rightValue: 'MEX', rightSub: 'Terminal 2',
      rows: [{ k: 'Operator', v: 'E-Life Limo' }, { k: 'Passengers', v: 'Max 2' }, { k: 'Driver waits', v: '15 min' }, { k: 'Ride', v: '125496669' }],
    },
  },
  {
    kind: 'Flight', group: 'Flights', status: 'Confirmed', title: 'Aeroméxico AM382', date: '2026-09-06',
    sub: 'Mexico City → Los Cabos · Sun Sep 6 · Business, 2 passengers',
    price: 'incl. GXUQKV', ref: 'GXUQKV', who: 'Return of AM379',
    detail: {
      leftLabel: 'Depart', leftValue: 'MEX', leftSub: '10:50 · T2',
      rightLabel: 'Arrive', rightValue: 'SJD', rightSub: '12:18 · T1',
      rows: [{ k: 'Flight', v: 'AM382' }, { k: 'Cabin', v: 'Business' }, { k: 'Passengers', v: '2' }, { k: 'Confirmation', v: 'GXUQKV' }],
      note: 'Same open question on baggage allowance as the outbound Aeroméxico leg.',
    },
  },
  {
    kind: 'Stay', group: 'Stays', status: 'No booking', title: 'London — home flat', date: '2026-09-04',
    sub: 'Aug 22–24 (2 nights) & Aug 28 – Sep 4 (7 nights)',
    price: '—', ref: '—', who: '9 nights total',
    detail: {
      leftLabel: 'First stay', leftValue: 'Aug 22', leftSub: '2 nights',
      rightLabel: 'Second', rightValue: 'Aug 28', rightSub: '7 nights',
      rows: [{ k: 'Booking', v: 'None needed' }, { k: 'Split', v: 'Around the Austria leg' }],
    },
  },
  {
    kind: 'Stay', group: 'Stays', status: 'Prepaid', title: 'Grand Tirolia Kitzbühel', date: '2026-08-28',
    sub: 'Mon Aug 24 – Fri Aug 28 · 4 nights · Superior Double, Forest View',
    price: '€1,159.76', ref: '6105765738', who: 'PIN 6924',
    detail: {
      leftLabel: 'Check in', leftValue: 'Aug 24', leftSub: '15:00–00:00',
      rightLabel: 'Check out', rightValue: 'Aug 28', rightSub: '01:00–12:00',
      rows: [
        { k: 'Address', v: 'Eichenheim 10, 6370 Kitzbühel' },
        { k: 'Phone', v: '+43 5356 66615' },
        { k: 'Breakfast', v: 'Included' },
        { k: 'Charged', v: '≈ £992' },
        { k: 'City tax', v: '€40 at the property' },
      ],
      note: 'Non-refundable — dates cannot be changed. City tax of €5 per person per night is collected on site.',
    },
  },
  {
    kind: 'Stay', group: 'Stays', status: 'Free cancel', title: 'INNSiDE by Meliá Roma Norte', date: '2026-09-06',
    sub: 'Fri Sep 4 – Sun Sep 6 · 2 nights · The INNSiDE Room, King',
    price: 'US$376.21', ref: '6580133542', who: 'No prepayment',
    detail: {
      leftLabel: 'Check in', leftValue: 'Sep 4', leftSub: '15:00–23:00',
      rightLabel: 'Check out', rightValue: 'Sep 6', rightSub: '06:00–12:00',
      rows: [
        { k: 'Address', v: 'Av. Insurgentes Sur 253, Roma Nte' },
        { k: 'Deposit', v: 'MXN 2,000 on arrival' },
        { k: 'Total', v: 'US$376.21' },
      ],
      note: 'Free cancellation until Aug 31, 2026, 23:59 CST.',
    },
  },
];

export const FX = { GBP: 1, MXN: 23.37, USD: 1.3465, EUR: 1.17 };
export const SYM = { GBP: '£', MXN: 'MX$', USD: 'US$', EUR: '€' };

export const COSTS = [
  { label: 'Aeroméxico AM379 / AM382', cat: 'Flights', amount: 12254, cur: 'MXN', method: 'Amex ••1006', date: '2026-06-15' },
  { label: 'British Airways BA0242 / BA0243', cat: 'Flights', amount: 46472, cur: 'MXN', method: 'Amex ••1006', date: '2026-06-15' },
  { label: 'British Airways BA0926 / BA0937', cat: 'Flights', amount: 373, cur: 'GBP', method: 'Visa ••4417', date: '2026-06-20' },
  { label: 'Grand Tirolia Kitzbühel · 4 nights', cat: 'Lodging', amount: 992, cur: 'GBP', method: 'Visa ••4417', date: '2026-06-10' },
  { label: 'INNSiDE by Meliá Roma Norte', cat: 'Lodging', amount: 376.21, cur: 'USD', method: 'On arrival', date: '2026-07-25' },
  { label: 'Sixt car rental, Munich', cat: 'Car Rental', amount: 363.34, cur: 'EUR', method: 'Visa ••4417', date: '2026-07-01' },
  { label: 'Rides — SW9 to Heathrow', cat: 'Ground Transport', amount: 63.10, cur: 'GBP', method: 'Visa ••4417', date: '2026-08-10' },
  { label: 'Rides — Heathrow to SW9 flat', cat: 'Ground Transport', amount: 66.42, cur: 'GBP', method: 'Visa ••4417', date: '2026-08-10' },
  { label: 'Rides — Hotel to MEX Airport', cat: 'Ground Transport', amount: 26, cur: 'GBP', method: 'Visa ••4417', date: '2026-08-10' },
  { label: 'MEX airport taxi', cat: 'Ground Transport', amount: 0, cur: 'GBP', method: 'Included', date: '2026-08-10' },
];

export const CAT_COLOR = {
  Flights: BLUE, Lodging: TERRA, 'Car Rental': PLUM, 'Ground Transport': GOLD,
  Golf: SAGE, Health: '#8f6a6a', Meals: SAGE, Activities: PLUM, Other: '#a09889',
};

export const AIRPORTS = { SJD: { x: 11, y: 64 }, MEX: { x: 19, y: 70 }, LHR: { x: 57, y: 26 }, MUC: { x: 66, y: 33 } };

// Real coordinates for every point a journey leg touches — airports plus
// the informal stops (a postcode, a town, "the hotel") LEGS also uses —
// so the actual map can plot an accurate route, not just the 4 airports.
export const LOCATION_COORDS = {
  SJD: { lat: 23.1518, lon: -109.7215, label: 'Los Cabos Intl (SJD)' },
  MEX: { lat: 19.4363, lon: -99.0721, label: 'Mexico City Intl (MEX)' },
  LHR: { lat: 51.4700, lon: -0.4543, label: 'London Heathrow (LHR)' },
  MUC: { lat: 48.3538, lon: 11.7861, label: 'Munich Airport (MUC)' },
  SW9: { lat: 51.4720, lon: -0.1160, label: 'SW9, London' },
  Kitz: { lat: 47.4467, lon: 12.3927, label: 'Kitzbühel' },
  Hotel: { lat: 19.4194, lon: -99.1677, label: 'Roma Norte, Mexico City' },
};

export const LEGS = [
  { n: '1', from: 'SJD', to: 'MEX', sub: 'Aeroméxico AM379 · Business', when: 'Aug 21', type: 'Flight', bk: 0 },
  { n: '2', from: 'MEX', to: 'LHR', sub: 'British Airways BA0242 · overnight', when: 'Aug 21', type: 'Flight', bk: 1 },
  { n: '3', from: 'SW9', to: 'LHR', sub: 'Booking.com Rides · 04:20 pickup', when: 'Aug 24', type: 'Ground', bk: 2 },
  { n: '4', from: 'LHR', to: 'MUC', sub: 'British Airways BA0926', when: 'Aug 24', type: 'Flight', bk: 3 },
  { n: '5', from: 'MUC', to: 'Kitz', sub: 'Sixt Premium Elite Sedan · 4 days', when: 'Aug 24', type: 'Car', bk: 4 },
  { n: '6', from: 'MUC', to: 'LHR', sub: 'British Airways BA0937', when: 'Aug 28', type: 'Flight', bk: 5 },
  { n: '7', from: 'LHR', to: 'SW9', sub: 'Booking.com Rides · flight-tracked', when: 'Aug 28', type: 'Ground', bk: 6 },
  { n: '8', from: 'LHR', to: 'MEX', sub: 'British Airways BA0243', when: 'Sep 4', type: 'Flight', bk: 7 },
  { n: '9', from: 'MEX', to: 'Hotel', sub: 'Booking.com taxi · included', when: 'Sep 4', type: 'Ground', bk: 8 },
  { n: '10', from: 'Hotel', to: 'MEX', sub: 'Booking.com Rides · 07:50 pickup', when: 'Sep 6', type: 'Ground', bk: 9 },
  { n: '11', from: 'MEX', to: 'SJD', sub: 'Aeroméxico AM382 · Business', when: 'Sep 6', type: 'Flight', bk: 10 },
];

// No built-in cards — the three that used to live here (Visa/Amex/
// Mastercard with made-up last-4s) were placeholder demo content, not real
// cards on the account. Every card shown in the app now comes from
// customCards, added for real via "+ Add a card". Existing expense entries
// that still say e.g. "Visa ••4417" are just text on that entry — fix them
// from Expenses by tapping the method tag, same as any other correction.
export const CARDS = [];

export const CITY_BY_DAY = ['MEX', 'LON', 'LON', 'AUT', 'AUT', 'AUT', 'AUT', 'LON', 'LON', 'LON', 'LON', 'LON', 'LON', 'LON', 'MEX', 'MEX', 'CAB'];

export const PLACES = {
  LON: {
    query: 'Borough Market', hint: 'near London',
    pts: [{ x: 30, y: 58, on: true }, { x: 56, y: 40, on: false }, { x: 76, y: 62, on: false }],
    list: [
      { name: 'Borough Market', sub: 'Food market · Southwark', dist: '3.4 km', glyph: '01', tint: 'rgba(201,111,63,.14)', tintFg: TERRA },
      { name: 'Kew Gardens', sub: 'Gardens · easy, flat walking', dist: '11 km', glyph: '02', tint: 'rgba(107,143,90,.14)', tintFg: SAGE },
      { name: 'Barbican Conservatory', sub: 'Sunday openings only', dist: '6.1 km', glyph: '03', tint: 'rgba(63,111,143,.13)', tintFg: BLUE },
    ],
  },
  AUT: {
    query: 'Berggericht, Kitzbühel', hint: 'near Kitzbühel',
    pts: [{ x: 26, y: 62, on: true }, { x: 52, y: 38, on: false }, { x: 74, y: 58, on: false }],
    list: [
      { name: 'Berggericht', sub: 'Tirolean · Kitzbühel Altstadt', dist: '4.1 km', glyph: '01', tint: 'rgba(201,111,63,.14)', tintFg: TERRA },
      { name: 'Kitzbüheler Horn — cable car', sub: 'Viewpoint · last ascent 17:00', dist: '6.8 km', glyph: '02', tint: 'rgba(63,111,143,.13)', tintFg: BLUE },
      { name: 'Schwarzsee', sub: 'Lake · warm water, easy walk', dist: '5.2 km', glyph: '03', tint: 'rgba(107,143,90,.14)', tintFg: SAGE },
    ],
  },
  MEX: {
    query: 'Contramar, Roma Norte', hint: 'near Mexico City',
    pts: [{ x: 22, y: 52, on: true }, { x: 48, y: 66, on: false }, { x: 72, y: 44, on: false }],
    list: [
      { name: 'Contramar', sub: 'Seafood · Roma Norte · book ahead', dist: '1.1 km', glyph: '01', tint: 'rgba(201,111,63,.14)', tintFg: TERRA },
      { name: 'Parque México', sub: 'Park · Condesa loop', dist: '1.8 km', glyph: '02', tint: 'rgba(107,143,90,.14)', tintFg: SAGE },
      { name: 'Museo Soumaya', sub: 'Museum · Polanco', dist: '7.3 km', glyph: '03', tint: 'rgba(63,111,143,.13)', tintFg: BLUE },
    ],
  },
  CAB: {
    query: 'Acre Baja', hint: 'near Los Cabos',
    pts: [{ x: 24, y: 64, on: true }, { x: 54, y: 50, on: false }, { x: 78, y: 56, on: false }],
    list: [
      { name: 'Acre Baja', sub: 'Farm restaurant · San José', dist: '12 km', glyph: '01', tint: 'rgba(201,111,63,.14)', tintFg: TERRA },
      { name: 'Playa Palmilla', sub: 'Calm swimming beach', dist: '9.4 km', glyph: '02', tint: 'rgba(63,111,143,.13)', tintFg: BLUE },
      { name: 'Flora Farms', sub: 'Dinner · reserve early', dist: '15 km', glyph: '03', tint: 'rgba(107,143,90,.14)', tintFg: SAGE },
    ],
  },
};

export const EXPENSE_CATEGORIES = ['Flights', 'Lodging', 'Car Rental', 'Ground', 'Golf', 'Health', 'Meals', 'Activities', 'Other'];
export const STOP_KINDS = ['Food', 'Sight', 'Golf', 'Spa', 'Transit', 'Other'];
export const STOP_KIND_TO_CATEGORY = { Food: 'Meals', Sight: 'Activities', Golf: 'Golf', Spa: 'Health', Transit: 'Ground Transport', Other: 'Other' };
export const DURATIONS = ['1h', '2h', '3h', 'Half day'];
export const CITY_CURRENCY = { LON: 'GBP', AUT: 'EUR', MEX: 'MXN', CAB: 'USD' };
// Real coordinates (unlike AIRPORTS' schematic x/y) for weather lookups.
export const CITY_COORDS = {
  LON: { lat: 51.5074, lon: -0.1278, label: 'London' },
  AUT: { lat: 47.4467, lon: 12.3927, label: 'Kitzbühel' },
  MEX: { lat: 19.4326, lon: -99.1332, label: 'Mexico City' },
  CAB: { lat: 22.8905, lon: -109.9167, label: 'Los Cabos' },
};
export const SLOTS = [
  ['morning', 'AM', 'Morning'],
  ['afternoon', 'PM', 'Afternoon'],
  ['evening', 'Eve', 'Evening'],
];

export const fmt = (n) => n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

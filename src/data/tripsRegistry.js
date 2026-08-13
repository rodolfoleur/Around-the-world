import {
  DAYS, BOOKINGS, COSTS, TRAVELERS, TRIP, TERRA, BLUE, SAGE, PLUM, GOLD,
} from './trip.js';
import { emptyDaysForRange } from '../utils/dates.js';

export const BABYMOON_ID = 'babymoon';

const AVATAR_COLORS = [TERRA, BLUE, SAGE, PLUM, GOLD];

/**
 * The one curated trip — real itinerary, real bookings, real costs, plus
 * the city-aware "add an activity" location suggestions and the journey
 * map. Every other trip is user-created and starts empty.
 */
export function babymoonTrip() {
  return {
    id: BABYMOON_ID,
    title: TRIP.title,
    startDate: DAYS[0].iso,
    endDate: DAYS[DAYS.length - 1].iso,
    travelers: TRAVELERS,
    route: TRIP.route,
    currency: 'GBP',
    curated: true, // enables journey map/legs + city-aware place suggestions
    days: DAYS,
    bookings: BOOKINGS,
    costs: COSTS,
    extraCosts: [],
    extraActivities: {},
    customCards: [],
    todos: [],
    photos: {},
    roadTrip: false,
    journeyLegs: [],
  };
}

function initials(name) {
  return (name.trim()[0] || '?').toUpperCase();
}

/** Parses a free-text "who's going" field into traveler objects with assigned colors. */
export function parseTravelers(namesText) {
  const names = (namesText || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) names.push('You');
  return names.map((name, i) => ({ name, initial: initials(name), color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));
}

let counter = 0;
function newTripId() {
  counter += 1;
  return `trip-${Date.now()}-${counter}`;
}

/**
 * Builds a brand-new trip from the create-trip form fields. `route` and
 * `dayThemes` are optional — filled in when the trip came from the AI
 * description flow, blank/omitted for a manually-created trip. A day
 * theme becomes that day's morning slot, so it shows up in Plan/Trip
 * like any other planned item; themes are zipped to days by index and
 * simply run out silently if the AI returned fewer than there are days.
 */
export function createEmptyTrip({ title, startDate, endDate, travelersText, route, dayThemes }) {
  const days = emptyDaysForRange(startDate, endDate);
  (dayThemes || []).forEach((theme, i) => {
    if (days[i] && theme && theme.trim()) days[i].parts.morning = theme.trim();
  });
  return {
    id: newTripId(),
    title: title.trim(),
    startDate,
    endDate,
    travelers: parseTravelers(travelersText),
    route: (route || '').trim(),
    currency: 'GBP',
    curated: false,
    days,
    bookings: [],
    costs: [],
    extraCosts: [],
    extraActivities: {},
    customCards: [],
    todos: [],
    photos: {},
    roadTrip: false,
    journeyLegs: [],
  };
}

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CARDS, FX, CITY_BY_DAY, CITY_CURRENCY, PLACES,
  STOP_KIND_TO_CATEGORY, EXPENSE_CATEGORIES, fmt,
} from '../data/trip.js';

// Rotates through the app's accent colors for user-added cards, since
// there's no per-card art the way the seed data has hand-picked gradients.
const CARD_SWATCHES = [
  'linear-gradient(135deg,#c96f3f,#8f4826)',
  'linear-gradient(135deg,#3f6f8f,#27455a)',
  'linear-gradient(135deg,#6b8f5a,#42592f)',
  'linear-gradient(135deg,#8a6a9f,#5c4570)',
  'linear-gradient(135deg,#b08d4f,#7a5f35)',
];

/**
 * Per-trip UI state (tab, open sheet, filters, form fields) plus derived
 * data computed from the live trip descriptor. The trip's actual content
 * (days/bookings/costs/extraCosts/extraActivities) lives in `meta` and is
 * kept fresh by useTripsStore's realtime subscription — this hook never
 * owns that data itself, so an edit made on another device just shows up
 * here the next time `meta` updates.
 *
 * `onUpdateTrip(patch)` persists a partial change (extraCosts/extraActivities)
 * back to Supabase, already bound to this trip's id by the caller.
 */
const KIND_TO_GROUP = { Flight: 'Flights', Stay: 'Stays', Ground: 'Ground', Car: 'Car', Event: 'Events' };
const EMPTY_ARR = [];
const EMPTY_OBJ = {};

export function useTripState(meta, onUpdateTrip) {
  // Always-current mirror of the latest `meta` prop, so a mutator that
  // merges against an existing array/object field (photos, expense method,
  // road-trip legs, etc.) reads the freshest value instead of whatever a
  // stale useCallback closure captured. Without this, two writes to the
  // same field fired close together (two auto photo lookups resolving
  // near-simultaneously, or two edits landing in the same render window)
  // can each merge against the same outdated snapshot and clobber one
  // another. Assigning during render is intentional and safe here — it
  // never drives what gets rendered, it just keeps the ref current for the
  // next callback invocation.
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const [state, setState] = useState(() => ({
    tab: 'home',
    day: 0,
    sheet: null, // null | 'expense' | 'addstop' | 'booking'
    bookingIdx: 0,
    bFilter: 'All',
    legFilter: 'All',
    journeyFocusLeg: null,

    // road-trip "+ add a leg" form
    legFrom: '',
    legTo: '',
    legDate: '',
    legNotes: '',

    // add-a-cost sheet
    expDesc: '',
    expAmount: '',
    expCur: meta.currency || 'GBP',
    expCat: 'Meals',
    expDate: new Date().toISOString().slice(0, 10),
    payMethod: 'Credit',
    card: '', // no built-in default now that CARDS starts empty — set once a real card exists

    // add-an-activity sheet
    activityName: '',
    stopKind: 'Food',
    stopDurIdx: 1,
    stopSlot: 'Evening',
    stopStart: '19:30',
    stopBudget: true,
    stopEstimate: '',
    stopPick: 0,
    hasLocation: false,
    stopQueryText: '',

    // add-a-booking sheet
    bkKind: 'Flight',
    bkTitle: '',
    bkSub: '',
    bkPrice: '',
    bkStatus: 'Confirmed',
    bkDate: '',
    bkRef: '',
    bkWho: '',
    bkLeftLabel: '',
    bkLeftValue: '',
    bkLeftSub: '',
    bkRightLabel: '',
    bkRightValue: '',
    bkRightSub: '',
    bkNote: '',

    // add-a-card sheet
    newCardName: '',
    newCardNumber: '',
    newCategoryDraft: '', // typed-but-not-yet-saved custom expense category, shown as a pill immediately
  }));

  const patch = useCallback((next) => {
    setState((s) => ({ ...s, ...(typeof next === 'function' ? next(s) : next) }));
  }, []);

  const go = useCallback((tab) => patch({ tab, sheet: null }), [patch]);
  const closeSheet = useCallback(() => patch({ sheet: null }), [patch]);
  const openBooking = useCallback((i) => patch({ sheet: 'booking', bookingIdx: i }), [patch]);
  const openExpenseSheet = useCallback(() => patch({
    sheet: 'expense', expDesc: '', expAmount: '', payMethod: 'Credit', expDate: new Date().toISOString().slice(0, 10),
  }), [patch]);
  const openAddStopSheet = useCallback(() => patch({
    sheet: 'addstop', activityName: '', hasLocation: false, stopEstimate: '', stopQueryText: '', stopPick: 0,
  }), [patch]);
  const openAddBookingSheet = useCallback(() => patch({
    sheet: 'addbooking', bkKind: 'Flight', bkTitle: '', bkSub: '', bkPrice: '', bkStatus: 'Confirmed', bkDate: '',
    bkRef: '', bkWho: '', bkLeftLabel: 'Depart', bkLeftValue: '', bkLeftSub: '',
    bkRightLabel: 'Arrive', bkRightValue: '', bkRightSub: '', bkNote: '',
  }), [patch]);
  const openAddCardSheet = useCallback(() => patch({ sheet: 'addcard', newCardName: '', newCardNumber: '' }), [patch]);

  // ---------- derived data (all sourced from the live `meta`) ----------
  // Defensive fallbacks throughout: `meta` should always come from rowToTrip
  // (which already defaults every array/object field), but this hook is the
  // one place everything funnels through, so a gap anywhere upstream — a
  // stale cache, a hand-edited row, a future schema change — degrades to
  // "nothing there yet" instead of taking the whole screen down. Falling
  // back to the same module-level empty array/object (rather than a fresh
  // `[]`/`{}` literal each render) keeps their identity stable so memoized
  // values below don't recompute on every render when a field is missing.
  const days = meta.days || EMPTY_ARR;
  const bookings = meta.bookings || EMPTY_ARR;
  const costs = meta.costs || EMPTY_ARR;
  const extraCosts = meta.extraCosts || EMPTY_ARR;
  const extraActivities = meta.extraActivities || EMPTY_OBJ;
  // Tagged with where each entry actually lives (the curated seed `costs`
  // array vs. user-added `extraCosts`) and its index there, so an edit made
  // from the flattened/sorted list in the UI can be written back to the
  // right place — a payment method picked wrong (or a card that's since
  // been replaced) should stay correctable long after the entry was added.
  // Index tagged against the *full* underlying array (before filtering),
  // so a deleted entry's still-visible siblings keep pointing at their real
  // position — then `deleted` ones are dropped from what's actually shown.
  // Soft-deleted (not spliced) for the same reason journey legs are: a
  // real "delete the trip's only expense" write would make this column go
  // genuinely empty, which Realtime can't tell apart from an unchanged
  // large jsonb column being left out of a payload (see mergeRealtimeRow's
  // TOAST note) — filtering here instead of removing sidesteps that.
  const allCosts = useMemo(() => [
    ...costs.map((c, i) => ({ ...c, source: 'costs', srcIdx: i })),
    ...extraCosts.map((c, i) => ({ ...c, source: 'extraCosts', srcIdx: i })),
  ].filter((c) => !c.deleted), [costs, extraCosts]);
  const rows = useMemo(() => allCosts.map((c) => ({ ...c, gbpN: c.amount / (FX[c.cur] || 1) })), [allCosts]);
  const total = useMemo(() => rows.reduce((a, c) => a + c.gbpN, 0), [rows]);
  const catMap = useMemo(() => {
    const m = {};
    rows.forEach((c) => { m[c.cat] = (m[c.cat] || 0) + c.gbpN; });
    return m;
  }, [rows]);
  const methodMap = useMemo(() => {
    const m = {};
    rows.forEach((c) => { m[c.method] = (m[c.method] || 0) + c.gbpN; });
    return m;
  }, [rows]);

  // Custom categories aren't a separate stored list — any category a real
  // expense was tagged with just becomes a selectable pill from then on.
  // Combined with whatever's typed in the sheet right now (not saved yet)
  // so a brand-new category shows up as a pill immediately, not just after
  // the expense that uses it is actually added.
  const categories = useMemo(() => {
    const used = rows.map((r) => r.cat);
    const draft = state.newCategoryDraft.trim();
    return [...new Set([...EXPENSE_CATEGORIES, ...used, ...(draft ? [draft] : [])])];
  }, [rows, state.newCategoryDraft]);

  const customCards = meta.customCards || EMPTY_ARR;
  const cards = useMemo(() => [...CARDS, ...customCards], [customCards]);

  const todos = meta.todos || EMPTY_ARR;
  const photos = meta.photos || EMPTY_OBJ;
  const packing = meta.packing || EMPTY_ARR;

  const roadTrip = meta.roadTrip || false;
  // Soft-deleted the same way bookings are — no other code references a
  // journey leg by array position, but a real "delete the last leg" write
  // would make this column go genuinely empty, and Supabase Realtime can't
  // tell that apart from a large jsonb column just not being included in a
  // particular change payload (see mergeRealtimeRow's TOAST note). Filtering
  // out `deleted` ones here sidesteps that ambiguity entirely.
  const journeyLegs = useMemo(
    () => (meta.journeyLegs || EMPTY_ARR).filter((l) => !l.deleted),
    [meta.journeyLegs],
  );

  const EMPTY_DAY = { short: '', label: '', tag: 'Empty', transit: [], parts: {}, overnight: '' };
  const day = days.length ? days[Math.min(state.day, days.length - 1)] : EMPTY_DAY;
  const dayExtra = extraActivities[state.day] || {};

  const addExpense = useCallback(() => {
    const amount = parseFloat(state.expAmount);
    if (!state.expDesc.trim() || Number.isNaN(amount)) return false;
    const entry = {
      id: 'user-' + Date.now(),
      label: state.expDesc.trim(),
      cat: state.expCat,
      amount,
      cur: state.expCur,
      date: state.expDate || new Date().toISOString().slice(0, 10),
      method: state.payMethod === 'Credit'
        ? (cards.find((c) => c.id === state.card)?.name || 'Credit')
        : state.payMethod,
    };
    onUpdateTrip({ extraCosts: [...extraCosts, entry] });
    patch({ sheet: null, newCategoryDraft: '' });
    return true;
  }, [state.expAmount, state.expDesc, state.expCat, state.expCur, state.expDate, state.payMethod, state.card, cards, extraCosts, onUpdateTrip, patch]);

  /** Corrects the payment method on an existing expense — a wrong pick at
   * add-time, or a card that's since been replaced, shouldn't be stuck that
   * way forever. `source` is 'costs' (the curated seed entries) or
   * 'extraCosts' (anything added in the app); `idx` is that entry's index
   * within whichever one it actually lives in (see allCosts, above). Reads
   * the array to patch from metaRef so this stays correct even if it fires
   * right after another edit that hasn't rendered through yet. */
  const updateExpenseMethod = useCallback((source, idx, method) => {
    const arr = metaRef.current[source] || EMPTY_ARR;
    onUpdateTrip({ [source]: arr.map((c, i) => (i === idx ? { ...c, method } : c)) });
  }, [onUpdateTrip]);

  /** Removes an expense — logged twice, added by mistake, whatever the
   * reason. Soft-delete (see allCosts' filter, above) rather than a real
   * splice, same `source`/`idx` addressing as updateExpenseMethod. */
  const deleteExpense = useCallback((source, idx) => {
    const arr = metaRef.current[source] || EMPTY_ARR;
    onUpdateTrip({ [source]: arr.map((c, i) => (i === idx ? { ...c, deleted: true } : c)) });
  }, [onUpdateTrip]);

  const addActivity = useCallback(() => {
    if (!state.activityName.trim()) return false;
    const slotKey = state.stopSlot.toLowerCase();
    const typedLocation = state.stopQueryText.trim();
    const pickedPreset = meta.curated && state.hasLocation
      ? PLACES[CITY_BY_DAY[state.day]]?.list?.[state.stopPick]
      : null;
    const location = typedLocation || pickedPreset?.name || '';
    const entry = {
      id: 'user-' + Date.now(),
      text: state.activityName.trim(),
      kind: state.stopKind,
      time: state.stopStart,
      ...(location ? { location } : {}),
    };
    const dayBucket = { ...(extraActivities[state.day] || {}) };
    dayBucket[slotKey] = [...(dayBucket[slotKey] || []), entry];
    const nextExtraActivities = { ...extraActivities, [state.day]: dayBucket };

    let nextExtraCosts = extraCosts;
    const estimate = parseFloat(state.stopEstimate);
    if (state.stopBudget && !Number.isNaN(estimate) && estimate > 0) {
      const cur = meta.curated ? (CITY_CURRENCY[CITY_BY_DAY[state.day]] || 'GBP') : (meta.currency || 'GBP');
      nextExtraCosts = [...extraCosts, {
        id: 'user-' + Date.now() + '-cost',
        label: entry.text,
        cat: STOP_KIND_TO_CATEGORY[state.stopKind] || 'Other',
        amount: estimate,
        cur,
        method: 'Cash',
      }];
    }
    onUpdateTrip({ extraActivities: nextExtraActivities, extraCosts: nextExtraCosts });
    patch({ sheet: null });
    return true;
  }, [state.activityName, state.stopSlot, state.stopKind, state.stopStart, state.stopBudget, state.stopEstimate,
    state.stopQueryText, state.hasLocation, state.stopPick, state.day, extraActivities, extraCosts, meta.curated, meta.currency, onUpdateTrip, patch]);

  const addBooking = useCallback(() => {
    if (!state.bkTitle.trim()) return false;
    const hasRoute = state.bkLeftValue.trim() || state.bkRightValue.trim();
    const rows = [];
    if (state.bkRef.trim()) rows.push({ k: 'Confirmation', v: state.bkRef.trim() });
    if (state.bkWho.trim()) rows.push({ k: 'Details', v: state.bkWho.trim() });
    const entry = {
      kind: state.bkKind,
      group: KIND_TO_GROUP[state.bkKind] || state.bkKind,
      status: state.bkStatus,
      title: state.bkTitle.trim(),
      sub: state.bkSub.trim(),
      price: state.bkPrice.trim(),
      date: state.bkDate || undefined,
      ref: state.bkRef.trim(),
      who: state.bkWho.trim(),
      detail: {
        ...(hasRoute ? {
          leftLabel: state.bkLeftLabel.trim(), leftValue: state.bkLeftValue.trim(), leftSub: state.bkLeftSub.trim(),
          rightLabel: state.bkRightLabel.trim(), rightValue: state.bkRightValue.trim(), rightSub: state.bkRightSub.trim(),
        } : {}),
        rows,
        note: state.bkNote.trim() || undefined,
      },
    };
    onUpdateTrip({ bookings: [...bookings, entry] });
    patch({ sheet: null });
    return true;
  }, [state.bkKind, state.bkTitle, state.bkSub, state.bkPrice, state.bkStatus, state.bkDate, state.bkRef, state.bkWho,
    state.bkLeftLabel, state.bkLeftValue, state.bkLeftSub, state.bkRightLabel, state.bkRightValue, state.bkRightSub,
    state.bkNote, bookings, onUpdateTrip, patch]);

  /**
   * Soft-deletes a booking — flags it rather than removing it from the
   * array. Bookings are referenced *positionally* elsewhere (a day's
   * transit items, and the curated trip's journey legs, both point at a
   * booking by array index), so actually splicing one out would silently
   * shift every later index and scramble those references. Filtering out
   * `deleted` bookings wherever they're listed gets the same visible
   * result without that risk.
   */
  const deleteBooking = useCallback((idx) => {
    if (idx < 0 || idx >= bookings.length) return;
    onUpdateTrip({ bookings: bookings.map((b, i) => (i === idx ? { ...b, deleted: true } : b)) });
  }, [bookings, onUpdateTrip]);

  /** Adds a payment card — only ever keeps the last 4 digits, never the full number. */
  const addCard = useCallback(() => {
    const name = state.newCardName.trim();
    const digits = state.newCardNumber.replace(/\D/g, '');
    if (!name || digits.length < 4) return false;
    const last4 = digits.slice(-4);
    const entry = {
      id: 'user-card-' + Date.now(),
      name: `${name} ••${last4}`,
      meta: '',
      swatch: CARD_SWATCHES[customCards.length % CARD_SWATCHES.length],
    };
    onUpdateTrip({ customCards: [...customCards, entry] });
    // Back to the expense sheet (the only place this opens from), with the
    // new card already selected — sheets aren't a stack, so without this
    // the in-progress expense (amount/description already typed) would be
    // lost the moment "Add a card" closed.
    patch({ sheet: 'expense', payMethod: 'Credit', card: entry.id, newCardName: '', newCardNumber: '' });
    return true;
  }, [state.newCardName, state.newCardNumber, customCards, onUpdateTrip, patch]);

  /**
   * The to-do list — things to see/do/try/buy that aren't bookable and
   * don't belong to any one day, so they live outside `days`/`bookings`
   * entirely. `addTodo` returns false for an empty/whitespace-only text
   * so the caller (an inline add row, not a full sheet) can skip clearing
   * its input on a no-op submit.
   */
  const addTodo = useCallback((text, kind) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return false;
    const entry = { id: 'todo-' + Date.now(), text: trimmed, kind: kind || 'Do', done: false };
    onUpdateTrip({ todos: [...todos, entry] });
    return true;
  }, [todos, onUpdateTrip]);

  const toggleTodo = useCallback((id) => {
    onUpdateTrip({ todos: todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  }, [todos, onUpdateTrip]);

  const removeTodo = useCallback((id) => {
    onUpdateTrip({ todos: todos.filter((t) => t.id !== id) });
  }, [todos, onUpdateTrip]);

  /**
   * The packing list — same shape as the to-do list (a flat array, not tied
   * to any day), with an optional `assignee` (a household member's user_id,
   * or omitted/null for a shared item — "passports" isn't just one person's
   * job). Reads from metaRef so a quick add-add-add doesn't lose an item to
   * a stale closure the way updateExpenseMethod's comment describes.
   */
  const addPackingItem = useCallback((text, category, assignee) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return false;
    const arr = metaRef.current.packing || EMPTY_ARR;
    const entry = { id: 'pack-' + Date.now(), text: trimmed, category: category || 'Misc', assignee: assignee || null, packed: false };
    onUpdateTrip({ packing: [...arr, entry] });
    return true;
  }, [onUpdateTrip]);

  const togglePackingItem = useCallback((id) => {
    const arr = metaRef.current.packing || EMPTY_ARR;
    onUpdateTrip({ packing: arr.map((p) => (p.id === id ? { ...p, packed: !p.packed } : p)) });
  }, [onUpdateTrip]);

  const removePackingItem = useCallback((id) => {
    const arr = metaRef.current.packing || EMPTY_ARR;
    onUpdateTrip({ packing: arr.filter((p) => p.id !== id) });
  }, [onUpdateTrip]);

  /** Bulk-adds packing items (used by "copy from another trip") in one
   * write rather than one onUpdateTrip per item — both faster and avoids
   * N racing writes each reading a stale metaRef.current.packing. Callers
   * are expected to have already deduped against what's already on the
   * list; this just assigns fresh ids and resets packed to false, since
   * "already packed on a past trip" doesn't mean packed on this one. */
  const addPackingItems = useCallback((items) => {
    if (!items.length) return;
    const arr = metaRef.current.packing || EMPTY_ARR;
    const stamped = items.map((p, i) => ({ ...p, id: `pack-${Date.now()}-${i}`, packed: false }));
    onUpdateTrip({ packing: [...arr, ...stamped] });
  }, [onUpdateTrip]);

  /** Sets (or clears, with url=null) a custom photo for one location —
   * keyed by the location's display name, so it works the same for a
   * curated city or any free-text one a user typed into a day's City field.
   * Merges against `metaRef.current.photos` (not the `photos` closure) so
   * this stays correct even if it fires right after another photo write
   * that hasn't rendered through yet. */
  const setPhoto = useCallback((key, url) => {
    onUpdateTrip({ photos: { ...metaRef.current.photos, [key]: url } });
  }, [onUpdateTrip]);

  const clearPhoto = useCallback((key) => {
    const next = { ...metaRef.current.photos };
    delete next[key];
    onUpdateTrip({ photos: next });
  }, [onUpdateTrip]);

  /** Batched version of setPhoto for writing several locations' photos in
   * one go — used by the auto-fetch lookup so N concurrent results become
   * one merged write instead of N racing ones. */
  const setPhotos = useCallback((entries) => {
    onUpdateTrip({ photos: { ...metaRef.current.photos, ...entries } });
  }, [onUpdateTrip]);

  /** On for a self-driven trip with nothing to auto-populate Journey from
   * (no flight/car-rental bookings) — swaps the tab into manual leg entry. */
  const toggleRoadTrip = useCallback(() => {
    onUpdateTrip({ roadTrip: !metaRef.current.roadTrip });
  }, [onUpdateTrip]);

  /** Appends one manually-entered leg. Geocoding (if any) already happened
   * by the time this is called — see AddLegForm in Journey.jsx — so this is
   * just the write, reading the base array from metaRef so it can't lose a
   * leg added moments earlier that hasn't rendered through yet. */
  const addJourneyLeg = useCallback((leg) => {
    const arr = metaRef.current.journeyLegs || EMPTY_ARR;
    onUpdateTrip({ journeyLegs: [...arr, { id: 'leg-' + Date.now(), ...leg }] });
  }, [onUpdateTrip]);

  /** Corrects one field on an existing leg — the km after a bad geocode, a
   * typo'd place name, notes — without touching any other leg. */
  const updateJourneyLeg = useCallback((id, patch) => {
    const arr = metaRef.current.journeyLegs || EMPTY_ARR;
    onUpdateTrip({ journeyLegs: arr.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }, [onUpdateTrip]);

  const deleteJourneyLeg = useCallback((id) => {
    const arr = metaRef.current.journeyLegs || EMPTY_ARR;
    onUpdateTrip({ journeyLegs: arr.map((l) => (l.id === id ? { ...l, deleted: true } : l)) });
  }, [onUpdateTrip]);

  /**
   * Patches one field on one day within the trip's days array. Refuses to
   * write if `days` looks empty/out of range — days should never actually
   * be empty for a real trip, but this is the one place that persists the
   * *entire* days array back to Supabase, so a bad transient read here
   * would otherwise silently overwrite every day with nothing.
   */
  const updateDayField = useCallback((dayIndex, field, value) => {
    if (!days.length || dayIndex < 0 || dayIndex >= days.length) {
      console.error('updateDayField: refusing to write — days is empty or index out of range', { dayIndex, daysLength: days.length });
      return;
    }
    const nextDays = days.map((d, i) => (i === dayIndex ? { ...d, [field]: value } : d));
    onUpdateTrip({ days: nextDays });
  }, [days, onUpdateTrip]);

  /** Changes what's written on the lodging line — the specific place, e.g. a hotel name. */
  const updateOvernight = useCallback((dayIndex, overnight) => updateDayField(dayIndex, 'overnight', overnight), [updateDayField]);

  /**
   * Changes which city a day is in — plans change (e.g. an extra night in
   * Windsor instead of London). Overrides the curated trip's default city
   * for that day; weather then looks this up instead of the built-in one.
   */
  const updateDayCity = useCallback((dayIndex, city) => updateDayField(dayIndex, 'city', city), [updateDayField]);

  /** Moves the itinerary's selected day by `delta` days, clamped to the
   * trip's actual range — shared by the day-rail chips, the prev/next
   * buttons, and swiping left/right through the day detail. */
  const goToDay = useCallback((delta) => {
    patch((s) => ({ day: Math.min(Math.max(s.day + delta, 0), Math.max(days.length - 1, 0)) }));
  }, [patch, days.length]);

  return {
    meta, state, patch, go, closeSheet, openBooking, openExpenseSheet, openAddStopSheet, openAddBookingSheet,
    openAddCardSheet, addExpense, addActivity, addBooking, deleteBooking, addCard, updateOvernight, updateDayCity, goToDay,
    addTodo, toggleTodo, removeTodo, setPhoto, clearPhoto, setPhotos, updateExpenseMethod, deleteExpense,
    toggleRoadTrip, addJourneyLeg, updateJourneyLeg, deleteJourneyLeg,
    addPackingItem, togglePackingItem, removePackingItem, addPackingItems,
    days, bookings, day, dayExtra, allCosts, rows, total, catMap, methodMap, categories, cards, todos, photos, fmt,
    roadTrip, journeyLegs, packing,
  };
}

import { useCallback, useMemo, useState } from 'react';
import {
  CARDS, FX, CITY_BY_DAY, CITY_CURRENCY,
  STOP_KIND_TO_CATEGORY, fmt,
} from '../data/trip.js';

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
const KIND_TO_GROUP = { Flight: 'Flights', Stay: 'Stays', Ground: 'Ground', Car: 'Car' };

export function useTripState(meta, onUpdateTrip) {
  const [state, setState] = useState(() => ({
    tab: 'home',
    day: 0,
    sheet: null, // null | 'expense' | 'addstop' | 'booking'
    bookingIdx: 0,
    bFilter: 'All',
    legFilter: 'All',

    // add-a-cost sheet
    expDesc: '',
    expAmount: '',
    expCur: meta.currency || 'GBP',
    expCat: 'Meals',
    payMethod: 'Credit',
    card: 'visa',

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

    // add-a-booking sheet
    bkKind: 'Flight',
    bkTitle: '',
    bkSub: '',
    bkPrice: '',
    bkStatus: 'Confirmed',
    bkRef: '',
    bkWho: '',
    bkLeftLabel: '',
    bkLeftValue: '',
    bkLeftSub: '',
    bkRightLabel: '',
    bkRightValue: '',
    bkRightSub: '',
    bkNote: '',
  }));

  const patch = useCallback((next) => {
    setState((s) => ({ ...s, ...(typeof next === 'function' ? next(s) : next) }));
  }, []);

  const go = useCallback((tab) => patch({ tab, sheet: null }), [patch]);
  const closeSheet = useCallback(() => patch({ sheet: null }), [patch]);
  const openBooking = useCallback((i) => patch({ sheet: 'booking', bookingIdx: i }), [patch]);
  const openExpenseSheet = useCallback(() => patch({
    sheet: 'expense', expDesc: '', expAmount: '', payMethod: 'Credit',
  }), [patch]);
  const openAddStopSheet = useCallback(() => patch({
    sheet: 'addstop', activityName: '', hasLocation: false, stopEstimate: '',
  }), [patch]);
  const openAddBookingSheet = useCallback(() => patch({
    sheet: 'addbooking', bkKind: 'Flight', bkTitle: '', bkSub: '', bkPrice: '', bkStatus: 'Confirmed',
    bkRef: '', bkWho: '', bkLeftLabel: 'Depart', bkLeftValue: '', bkLeftSub: '',
    bkRightLabel: 'Arrive', bkRightValue: '', bkRightSub: '', bkNote: '',
  }), [patch]);

  // ---------- derived data (all sourced from the live `meta`) ----------
  const days = meta.days;
  const bookings = meta.bookings;
  const allCosts = useMemo(() => [...meta.costs, ...meta.extraCosts], [meta.costs, meta.extraCosts]);
  const rows = useMemo(() => allCosts.map((c) => ({ ...c, gbpN: c.amount / FX[c.cur] })), [allCosts]);
  const total = useMemo(() => rows.reduce((a, c) => a + c.gbpN, 0), [rows]);
  const catMap = useMemo(() => {
    const m = {};
    rows.forEach((c) => { m[c.cat] = (m[c.cat] || 0) + c.gbpN; });
    return m;
  }, [rows]);

  const day = days[Math.min(state.day, days.length - 1)];
  const dayExtra = meta.extraActivities[state.day] || {};

  const addExpense = useCallback(() => {
    const amount = parseFloat(state.expAmount);
    if (!state.expDesc.trim() || Number.isNaN(amount)) return false;
    const entry = {
      id: 'user-' + Date.now(),
      label: state.expDesc.trim(),
      cat: state.expCat,
      amount,
      cur: state.expCur,
      method: state.payMethod === 'Credit'
        ? (CARDS.find((c) => c.id === state.card)?.name || 'Credit')
        : state.payMethod,
    };
    onUpdateTrip({ extraCosts: [...meta.extraCosts, entry] });
    patch({ sheet: null });
    return true;
  }, [state.expAmount, state.expDesc, state.expCat, state.expCur, state.payMethod, state.card, meta.extraCosts, onUpdateTrip, patch]);

  const addActivity = useCallback(() => {
    if (!state.activityName.trim()) return false;
    const slotKey = state.stopSlot.toLowerCase();
    const entry = {
      id: 'user-' + Date.now(),
      text: state.activityName.trim(),
      kind: state.stopKind,
      time: state.stopStart,
    };
    const dayBucket = { ...(meta.extraActivities[state.day] || {}) };
    dayBucket[slotKey] = [...(dayBucket[slotKey] || []), entry];
    const nextExtraActivities = { ...meta.extraActivities, [state.day]: dayBucket };

    let nextExtraCosts = meta.extraCosts;
    const estimate = parseFloat(state.stopEstimate);
    if (state.stopBudget && !Number.isNaN(estimate) && estimate > 0) {
      const cur = meta.curated ? (CITY_CURRENCY[CITY_BY_DAY[state.day]] || 'GBP') : (meta.currency || 'GBP');
      nextExtraCosts = [...meta.extraCosts, {
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
  }, [state.activityName, state.stopSlot, state.stopKind, state.stopStart, state.stopBudget, state.stopEstimate, state.day, meta.extraActivities, meta.extraCosts, meta.curated, meta.currency, onUpdateTrip, patch]);

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
    onUpdateTrip({ bookings: [...meta.bookings, entry] });
    patch({ sheet: null });
    return true;
  }, [state.bkKind, state.bkTitle, state.bkSub, state.bkPrice, state.bkStatus, state.bkRef, state.bkWho,
    state.bkLeftLabel, state.bkLeftValue, state.bkLeftSub, state.bkRightLabel, state.bkRightValue, state.bkRightSub,
    state.bkNote, meta.bookings, onUpdateTrip, patch]);

  return {
    meta, state, patch, go, closeSheet, openBooking, openExpenseSheet, openAddStopSheet, openAddBookingSheet,
    addExpense, addActivity, addBooking,
    days, bookings, day, dayExtra, allCosts, rows, total, catMap, fmt,
  };
}

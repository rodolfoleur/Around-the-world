// Vercel serverless function — the only place the Anthropic API key lives.
// Turns a free-text trip description into the "backbone" of a trip: title,
// dates, a rough route, and one short theme line per day. Deliberately
// does NOT invent specific bookings, prices, or times — those come from
// real confirmations (Add booking) or the user's own planning (Plan tab),
// so nothing fabricated-but-authoritative-looking ends up on the trip.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const TripBackbone = z.object({
  title: z.string().describe('A short, appealing trip title, e.g. "Ski week in Chamonix"'),
  startDate: z.string().describe('ISO date YYYY-MM-DD. Infer a sensible year if the description omits one — prefer the next upcoming occurrence of any month/season mentioned.'),
  endDate: z.string().describe('ISO date YYYY-MM-DD, on or after startDate.'),
  route: z.string().describe('Short route summary like "LIS → OPO" or "Rome → Florence → Venice". Empty string if the trip is a single destination or the route is unclear.'),
  travelersText: z.string().describe('Comma-separated first names of travelers explicitly mentioned in the description. Empty string if none are mentioned — never invent names.'),
  days: z.array(z.string()).describe('One short line per day of the trip (chronological order) describing that day\'s general focus or region, e.g. "Arrive, settle in" or "Explore the old town". No specific times, prices, bookings, or venue names — just a one-line theme per day.'),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'AI trip planning isn’t configured yet — ANTHROPIC_API_KEY is missing on the server.' });
    return;
  }

  const description = (req.body && req.body.description || '').toString().trim();
  if (!description) {
    res.status(400).json({ error: 'Description is required.' });
    return;
  }
  if (description.length > 4000) {
    res.status(400).json({ error: 'Description is too long (4000 characters max).' });
    return;
  }

  try {
    const client = new Anthropic({ apiKey });
    const today = new Date().toISOString().slice(0, 10);

    const response = await client.messages.parse({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      system: `You turn a short, casual trip description into the structural backbone of a trip — title, dates, a rough route, and a one-line theme per day. You never invent specific bookings, prices, confirmation numbers, or clock times; those come later from real confirmations or the traveler's own planning. Today's date is ${today} — resolve any relative or vague dates ("next spring", "for 10 days in June") against it, picking the next sensible upcoming occurrence.`,
      messages: [{ role: 'user', content: description }],
      output_config: { format: zodOutputFormat(TripBackbone) },
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      res.status(502).json({ error: 'The AI response could not be parsed into a trip. Try rephrasing the description.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.endDate) || parsed.endDate < parsed.startDate) {
      res.status(502).json({ error: 'The AI returned invalid dates. Try being more specific about when the trip happens.' });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error('plan-trip error:', err);
    const message = err instanceof Anthropic.AuthenticationError
      ? 'AI trip planning isn’t configured correctly — invalid API key.'
      : err instanceof Anthropic.RateLimitError
        ? 'AI trip planning is rate-limited right now — try again in a moment.'
        : 'Something went wrong generating the trip. Try again or fill it in manually.';
    res.status(502).json({ error: message });
  }
}

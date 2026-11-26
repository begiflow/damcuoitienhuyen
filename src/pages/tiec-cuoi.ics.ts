import type { APIRoute } from 'astro';
import { icsText } from '../lib/calendar';

// /tiec-cuoi.ics: 1 file chung cho mọi khách (không có dữ liệu khách)
export const GET: APIRoute = ({ site }) =>
  new Response(icsText(String(site)), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });

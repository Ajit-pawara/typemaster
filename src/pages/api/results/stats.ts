import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDb();
    const results = await db.collection('test_results')
      .find({ userId: new ObjectId(user.id) })
      .toArray();

    const totalTests = results.length;
    const highestWpm = results.reduce((max, r) => r.wpm > max ? r.wpm : max, 0);
    const avgWpm = totalTests > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / totalTests) 
      : 0;
    const avgAccuracy = totalTests > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests) 
      : 0;

    return new Response(JSON.stringify({
      stats: {
        totalTests,
        highestWpm,
        avgWpm,
        avgAccuracy
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

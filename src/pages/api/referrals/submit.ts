import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';

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
    const referrals = await db.collection('users')
      .find({ referredBy: user.referralCode })
      .project({ username: 1, createdAt: 1 })
      .toArray();

    return new Response(JSON.stringify({ referrals }), {
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

import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';
import { checkAndAwardAchievements } from '../../../lib/achievements';
import { ObjectId } from 'mongodb';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { wpm, accuracy, mode, duration, errors, errorKeys } = body;

    if (wpm === undefined || accuracy === undefined || !mode || !duration) {
      return new Response(JSON.stringify({ error: 'Missing results data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDb();
    const userObjectId = new ObjectId(user.id);

    // Save test result
    const testResult = {
      userId: userObjectId,
      wpm: Number(wpm),
      accuracy: Number(accuracy),
      mode,
      duration: Number(duration),
      errors: Number(errors || 0),
      errorKeys: errorKeys || {},
      createdAt: new Date()
    };

    await db.collection('test_results').insertOne(testResult);

    // Check and award achievements
    const newAchievements = await checkAndAwardAchievements(user.id, db);

    return new Response(JSON.stringify({
      message: 'Result saved successfully',
      newAchievements
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit Result Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

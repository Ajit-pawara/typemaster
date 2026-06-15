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
    const { wpm, accuracy } = body;

    if (wpm === undefined || accuracy === undefined) {
      return new Response(JSON.stringify({ error: 'Missing challenge results data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDb();
    const userObjectId = new ObjectId(user.id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Get or Create Today's Challenge
    let challenge = await db.collection('daily_challenges').findOne({ date: todayStr });
    if (!challenge) {
      const defaultTexts = [
        "The only limit to our realization of tomorrow will be our doubts of today.",
        "Life is 10% what happens to us and 90% how we react to it.",
        "To write clean code is to understand the balance between complexity and elegance.",
        "A smooth sea never made a skilled sailor, and practice makes perfect.",
        "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence."
      ];
      const text = defaultTexts[Math.floor(Math.random() * defaultTexts.length)];
      const newChallenge = { date: todayStr, text, createdAt: new Date() };
      const insertRes = await db.collection('daily_challenges').insertOne(newChallenge);
      challenge = { ...newChallenge, _id: insertRes.insertedId };
    }

    // Check if user already participated today
    const participant = await db.collection('challenge_participants').findOne({
      challengeId: challenge._id,
      userId: userObjectId
    });

    if (!participant) {
      // First submission today: Insert record
      await db.collection('challenge_participants').insertOne({
        challengeId: challenge._id,
        userId: userObjectId,
        username: user.username,
        wpm: Number(wpm),
        accuracy: Number(accuracy),
        createdAt: new Date()
      });

      // Manage Daily Streak
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const userProfile = await db.collection('users').findOne({ _id: userObjectId });
      
      let newStreak = 1;
      if (userProfile) {
        // Find if they were active yesterday to continue the streak
        const lastActive = userProfile.lastActive ? new Date(userProfile.lastActive).toISOString().split('T')[0] : '';
        
        if (lastActive === todayStr) {
          newStreak = userProfile.streak || 1;
        } else if (lastActive === yesterdayStr) {
          newStreak = (userProfile.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
      }

      await db.collection('users').updateOne(
        { _id: userObjectId },
        { 
          $set: { 
            streak: newStreak,
            lastActive: new Date() 
          } 
        }
      );
    } else {
      // Re-submission: Update if new WPM is higher
      if (Number(wpm) > participant.wpm) {
        await db.collection('challenge_participants').updateOne(
          { _id: participant._id },
          { 
            $set: { 
              wpm: Number(wpm),
              accuracy: Number(accuracy),
              createdAt: new Date()
            } 
          }
        );
      }
    }

    // Check achievements (including streak achievements)
    const newAchievements = await checkAndAwardAchievements(user.id, db);

    return new Response(JSON.stringify({
      message: 'Challenge score recorded successfully',
      newAchievements
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit Challenge Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

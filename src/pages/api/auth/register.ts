import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { hashPassword, generateToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, username, password, referralCode: signupReferralCode } = body;

    if (!email || !username || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email or Username already taken' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash Password
    const passwordHash = await hashPassword(password);

    // Create unique referral code
    const shortRand = Math.floor(1000 + Math.random() * 9000);
    const referralCode = `${username.toLowerCase()}-${shortRand}`;

    // Handle referral tracking if signed up via a link
    let referredBy = null;
    if (signupReferralCode) {
      const referrer = await db.collection('users').findOne({ referralCode: signupReferralCode });
      if (referrer) {
        referredBy = signupReferralCode;
        // Increment referrer count
        await db.collection('users').updateOne(
          { _id: referrer._id },
          { $inc: { referralCount: 1 } }
        );
      }
    }

    const newUser = {
      email: email.toLowerCase(),
      username: username,
      passwordHash,
      streak: 0,
      lastActive: null,
      referralCode,
      referredBy,
      referralCount: 0,
      createdAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    // Generate JWT
    const token = generateToken({ id: userId, email: newUser.email, username: newUser.username });

    // Set Cookie
    cookies.set('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return new Response(JSON.stringify({
      message: 'Registration successful',
      user: {
        id: userId,
        email: newUser.email,
        username: newUser.username,
        referralCode: newUser.referralCode
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

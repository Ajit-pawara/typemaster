import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'typemaster-super-secret-key-123456';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: string; email: string; username: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<any> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('token='));
    
    if (!tokenCookie) return null;
    
    const token = tokenCookie.split('=')[1];
    if (!token) return null;
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;
    
    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      streak: user.streak || 0,
      lastActive: user.lastActive,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralCount: user.referralCount || 0,
      createdAt: user.createdAt,
    };
  } catch (e) {
    console.error('Error in getUserFromRequest:', e);
    return null;
  }
}

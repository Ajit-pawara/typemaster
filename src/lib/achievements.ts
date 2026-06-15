import { Db, ObjectId } from 'mongodb';

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  wpm_50: {
    type: 'wpm_50',
    name: 'Speed Cadet',
    description: 'Achieve a speed of 50 WPM or higher.',
    icon: '⚡',
  },
  wpm_75: {
    type: 'wpm_75',
    name: 'Keyboard Warrior',
    description: 'Achieve a speed of 75 WPM or higher.',
    icon: '🔥',
  },
  wpm_100: {
    type: 'wpm_100',
    name: 'Type Master',
    description: 'Achieve a speed of 100 WPM or higher. Absolute mastery!',
    icon: '👑',
  },
  streak_7: {
    type: 'streak_7',
    name: 'Consistent Typer',
    description: 'Maintain a 7-day typing streak on Daily Challenges.',
    icon: '📅',
  },
  streak_30: {
    type: 'streak_30',
    name: 'Unstoppable Force',
    description: 'Maintain a 30-day typing streak on Daily Challenges.',
    icon: '🌟',
  },
};

export async function checkAndAwardAchievements(userId: string, db: Db): Promise<AchievementDefinition[]> {
  const userObjectId = new ObjectId(userId);
  
  // 1. Get already unlocked achievements
  const unlocked = await db.collection('achievements').find({ userId: userObjectId }).toArray();
  const unlockedTypes = new Set(unlocked.map(a => a.type));
  
  const newlyUnlocked: AchievementDefinition[] = [];
  
  // 2. Check WPM achievements (find highest WPM)
  const highestWpmResult = await db.collection('test_results')
    .find({ userId: userObjectId })
    .sort({ wpm: -1 })
    .limit(1)
    .toArray();
    
  if (highestWpmResult.length > 0) {
    const maxWpm = highestWpmResult[0].wpm;
    
    if (maxWpm >= 50 && !unlockedTypes.has('wpm_50')) {
      newlyUnlocked.push(ACHIEVEMENTS.wpm_50);
    }
    if (maxWpm >= 75 && !unlockedTypes.has('wpm_75')) {
      newlyUnlocked.push(ACHIEVEMENTS.wpm_75);
    }
    if (maxWpm >= 100 && !unlockedTypes.has('wpm_100')) {
      newlyUnlocked.push(ACHIEVEMENTS.wpm_100);
    }
  }
  
  // 3. Check streak achievements (get user's current streak)
  const user = await db.collection('users').findOne({ _id: userObjectId });
  if (user) {
    const streak = user.streak || 0;
    
    if (streak >= 7 && !unlockedTypes.has('streak_7')) {
      newlyUnlocked.push(ACHIEVEMENTS.streak_7);
    }
    if (streak >= 30 && !unlockedTypes.has('streak_30')) {
      newlyUnlocked.push(ACHIEVEMENTS.streak_30);
    }
  }
  
  // 4. Save newly unlocked achievements
  if (newlyUnlocked.length > 0) {
    const insertOps = newlyUnlocked.map(ach => ({
      userId: userObjectId,
      type: ach.type,
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      unlockedAt: new Date(),
    }));
    
    await db.collection('achievements').insertMany(insertOps);
  }
  
  return newlyUnlocked;
}

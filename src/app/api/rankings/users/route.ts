import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

interface UserRankItem {
    name: string;
    avatar: string;
    totalAssets: number;
    updatedAt: number;
}

function getLeaderboard(): UserRankItem[] {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to read leaderboard:', e);
    }
    return [];
}

function saveLeaderboard(data: UserRankItem[]) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Failed to save leaderboard:', e);
    }
}

export async function GET() {
    // Return top 20 users
    const list = getLeaderboard();
    // Sort just in case
    list.sort((a, b) => b.totalAssets - a.totalAssets);
    return NextResponse.json(list.slice(0, 20));
}

export async function POST(request: Request) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { totalAssets } = await request.json();
        if (typeof totalAssets !== 'number') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const user = session.user;
        let list = getLeaderboard();

        // Remove existing entry for this user
        list = list.filter(item => item.name !== user.name);

        // Add new entry
        list.push({
            name: user.displayName || user.name,
            avatar: user.avatar,
            totalAssets,
            updatedAt: Date.now()
        });

        // Sort desc
        list.sort((a, b) => b.totalAssets - a.totalAssets);

        // Keep top 100 on disk
        if (list.length > 100) {
            list = list.slice(0, 100);
        }

        saveLeaderboard(list);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update ranking' }, { status: 500 });
    }
}

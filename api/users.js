const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const notion = new Client({ auth: process.env.NOTION_TOKEN });
        const { q: query } = req.query; // 쿼리 파라미터 받기
        
        let allUsers = [];
        let hasMore = true;
        let startCursor;

        while (hasMore) {
            const response = await notion.users.list({
                start_cursor: startCursor
            });
            
            allUsers = allUsers.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        let users = allUsers
            .filter(user => user.type === 'person')
            .map(user => ({
                id: user.id,
                name: user.name,
                email: user.person?.email || ''
            }));

        // 쿼리가 있으면 이름이나 이메일로 필터링
        if (query && query.trim()) {
            const searchQuery = query.trim().toLowerCase();
            users = users.filter(user => 
                user.name.toLowerCase().includes(searchQuery) || 
                user.email.toLowerCase().includes(searchQuery)
            );
        }

        users = users.sort((a, b) => a.name.localeCompare(b.name));
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}
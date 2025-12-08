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
        
        let allFeatures = [];
        let hasMore = true;
        let startCursor;

        while (hasMore) {
            let requestOptions = {
                database_id: process.env.FEATURE_DATABASE_ID,
                start_cursor: startCursor
            };

            // 쿼리가 있으면 제목에서 검색
            if (query && query.trim()) {
                requestOptions.filter = {
                    property: "이름",
                    title: {
                        contains: query.trim()
                    }
                };
            }

            const response = await notion.databases.query(requestOptions);
            
            allFeatures = allFeatures.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }
        
        const features = allFeatures.map(page => {
            const titleBlocks = page.properties["이름"]?.title || [];
            const title = titleBlocks.map(block => block.plain_text).join('') || '';
            return {
                id: page.id,
                title: title,
                url: page.url
            };
        });
        
        console.log(`Fetched ${features.length} features total`);
        res.json(features);
    } catch (error) {
        console.error('Error fetching features:', error);
        res.status(500).json({ 
            error: 'Failed to fetch features',
            details: error.message,
            code: error.code
        });
    }
}
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
        
        const response = await notion.databases.query({
            database_id: process.env.TRY_DATABASE_ID,
            filter: {
                and: [
                    {
                        property: "평가 상태",
                        status: {
                            equals: "평가 중"
                        }
                    },
                    {
                        property: "Feature Try",
                        checkbox: {
                            equals: true
                        }
                    }
                ]
            }
        });
        
        const tries = response.results.map(page => ({
            id: page.id,
            title: page.properties["내용"]?.title[0]?.plain_text || 'Untitled',
            description: page.properties["평가 요약"]?.rich_text[0]?.plain_text || ''
        }));
        
        res.json(tries);
    } catch (error) {
        console.error('Error fetching tries:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tries',
            details: error.message,
            code: error.code
        });
    }
}
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const notion = new Client({ auth: process.env.NOTION_TOKEN });
        const { evaluatorId, evaluatorName, featureName, featureUrl, evaluations } = req.body;
        
        for (const evaluation of evaluations) {
            const reasonText = evaluation.reason ? evaluation.reason : "";

            // 피처가 없으면 평가자 이름 사용
            let titleContent;
            if (featureName && featureUrl) {
                titleContent = [{ 
                    text: { 
                        content: featureName,
                        link: { url: featureUrl } 
                    } 
                }];
            } else {
                titleContent = [{ text: { content: evaluatorName } }];
            }
            
            await notion.pages.create({
                parent: { database_id: process.env.EVALUATION_DATABASE_ID },
                properties: {
                    "_": {
                        title: titleContent
                    },
                    "Try": {
                        relation: [{ id: evaluation.tryId }]
                    },
                    "달성율": {
                        number: evaluation.score
                    },
                    "평가 이유": {
                        rich_text: [{ text: { content: reasonText } }]
                    },
                    "평가자": {
                        people: [{ id: evaluatorId }]
                    }
                }
            });
        }
        
        res.json({ success: true, message: 'Evaluations submitted successfully' });
    } catch (error) {
        console.error('Error submitting evaluations:', error);
        res.status(500).json({ error: 'Failed to submit evaluations' });
    }
}
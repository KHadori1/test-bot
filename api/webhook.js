// api/webhook.js

import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(400);
        }
    } else if (req.method === 'POST') {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const event of entry.messaging) {
                    const sender_psid = event.sender.id;
                    if (event.message && event.message.text) {
                        const response = {
                            "text": `You sent the message: "${event.message.text}". Now send me an attachment!`
                        };
                        await callSendAPI(sender_psid, response);
                    }
                }
            }

            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function callSendAPI(sender_psid, response) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
    const request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    try {
        await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body);
    } catch (error) {
        console.error('Unable to send message:', error.response ? error.response.data : error.message);
    }
}

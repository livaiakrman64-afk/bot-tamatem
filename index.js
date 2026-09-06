import fs from 'fs';
import pkg from '@whiskeysockets/baileys'
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = pkg;

let points = {};
let vipUsers = [];
let goldUsers = [];

let shop = {
    "تثبيت": { price: 200, desc: "تثبيت رسالة ساعة" },
    "VIP": { price: 1000, desc: "اوامر سرية + لون ذهبي" },
    "لون": { price: 500, desc: "اسمك ذهبي في التوب" },
    "اعلان": { price: 500, desc: "البوت بعلن عنك للكل" },
    "منشن": { price: 100, desc: "منشن الكل مرة واحدة" },
    "حماية": { price: 300, desc: "حماية من السرقة 24 ساعة" }
}

if(fs.existsSync('./points.json')) points = JSON.parse(fs.readFileSync('./points.json'));
if(fs.existsSync('./vip.json')) vipUsers = JSON.parse(fs.readFileSync('./vip.json'));
if(fs.existsSync('./gold.json')) goldUsers = JSON.parse(fs.readFileSync('./gold.json'));

function saveAll() {
    fs.writeFileSync('./points.json', JSON.stringify(points));
    fs.writeFileSync('./vip.json', JSON.stringify(vipUsers));
    fs.writeFileSync('./gold.json', JSON.stringify(goldUsers));
}

function getPoints(user) {
    if(!points[user]) points[user] = 50;
    return points[user];
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if(text === '.طماطمي') {
            let icon = goldUsers.includes(sender)? '✨' : '';
            await sock.sendMessage(from, { text: `${icon} نقاطك: ${getPoints(sender)} 🍅` });
        }

        if(text === '.متجر') {
            let txt = "🛒 *متجر الطماطم* 🛒\n\n";
            for(let item in shop){
                txt += `*.اشتري ${item}* : ${shop[item].price} 🍅\n_${shop[item].desc}_\n\n`;
            }
            await sock.sendMessage(from, { text: txt });
        }

        if(text.startsWith('.اشتري ')) {
            let item = text.split(' ')[1];
            if(!shop[item]) return sock.sendMessage(from, { text: "المنتج دا ما موجود" });
            if(getPoints(sender) < shop[item].price) return sock.sendMessage(from, { text: "طماطمك ما كافية 😅" });
            points[sender] -= shop[item].price;
            if(item === "VIP") vipUsers.push(sender);
            if(item === "لون") goldUsers.push(sender);
            saveAll();
            await sock.sendMessage(from, { text: `✅ مبروك اشتريت ${item}` });
        }

        if(text.startsWith('.اعلان ')) {
            if(getPoints(sender) < 500) return sock.sendMessage(from, { text: "الاعلان بي 500 🍅" });
            let ad = text.replace('.اعلان ', '');
            points[sender] -= 500;
            saveAll();
            await sock.sendMessage(from, { text: `📢 *اعلان ممول* 📢\n\n${ad}\n\n_دفع 500 🍅_` });
        }

        if(text === '.يومي') {
            let lastDaily = points[sender+"_daily"] || 0;
            if(Date.now() - lastDaily < 86400000) return sock.sendMessage(from, { text: "تعال بكرة تاني 😅" });
            points[sender] += 10;
            points[sender+"_daily"] = Date.now();
            saveAll();
            await sock.sendMessage(from, { text: "🎁 جاتك 10 🍅 هدية يومية" });
        }

        if(text === '.نكتة'){
            let jokes = ["محش قالو ليه انت غبي قال ليهم منو؟", "واحد بخيل مات... اهلو قالو الله يرحمو قالو لا نخليه"];
            await sock.sendMessage(from, { text: jokes[Math.floor(Math.random() * jokes.length)] });
        }
    });
}
startBot();

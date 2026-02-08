require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const SC = require('./modules/sc');
const Stephen = require('./modules/stephen');
const MicSc = require('./modules/micSc');

class Prosc {
    constructor(sc, stephen, micSc) {
        this.sc = sc;
        this.stephen = stephen;
        this.micSc = micSc;
        this.dynamicRoutes = {};
        this.logs = [];
        this.users = {
            [process.env.ADMIN_USER]: { password: process.env.ADMIN_PASS, role: "admin" }
        };
    }

    async fetchData() {
        const scData = await this.sc.getData();
        const stephenData = await this.stephen.getData();
        return { ...scData, ...stephenData, timestamp: new Date() };
    }

    async sendData() {
        const data = await this.fetchData();
        await this.sc.receiveData(data);
        await this.stephen.receiveData(data);
        this.micSc.processData(data);
        return data;
    }

    logRequest(route, user, input, output) {
        const entry = { route, user, input, output, timestamp: new Date() };
        this.logs.push(entry);
        console.log("📜 Log:", entry);
    }

    authenticate(req) {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return null;
        const [username, password] = Buffer.from(authHeader, "base64").toString().split(":");
        const user = this.users[username];
        if (user && user.password === password) return { username, role: user.role };
        return null;
    }

    autoRegisterAPIFromSchema(schema, owner) {
        const { route, version = "v1", processLogic, rolesAllowed = ["admin"] } = schema;
        const fullRoute = `/dynamic/${route}/${version}`;

        if (this.dynamicRoutes[fullRoute]) {
            console.log(`⚠️ Route ${fullRoute} มีอยู่แล้ว`);
            return;
        }
        this.dynamicRoutes[fullRoute] = { owner, rolesAllowed };

        app.post(fullRoute, async (req, res) => {
            try {
                const user = this.authenticate(req);
                if (!user) return res.status(403).json({ status: "error", message: "Unauthorized" });
                if (!rolesAllowed.includes(user.role)) return res.status(403).json({ status: "error", message: "Forbidden" });

                const inputData = req.body;
                const result = await processLogic(inputData, this.sc, this.stephen);
                this.micSc.processData(result);
                this.logRequest(fullRoute, user.username, inputData, result);
                res.json({ status: "success", data: result });
            } catch (err) {
                console.error(err);
                res.status(500).json({ status: "error", message: err.message });
            }
        });

        console.log(`✅ API สร้างเรียบร้อย: ${fullRoute}, owner: ${owner}`);
    }

    getDashboard() {
        return {
            totalAPIs: Object.keys(this.dynamicRoutes).length,
            logs: this.logs,
            dynamicRoutes: this.dynamicRoutes
        };
    }
}

const sc = new SC();
const stephen = new Stephen();
const micSc = new MicSc();
const prosc = new Prosc(sc, stephen, micSc);

app.post("/prosc/registerSchema", (req, res) => {
    const schema = req.body;
    const owner = req.headers["owner"] || "unknown";
    prosc.autoRegisterAPIFromSchema(schema, owner);
    res.json({ status: "success", message: `API ${schema.route} สร้างเรียบร้อย` });
});

app.get("/prosc/dashboard", (req, res) => {
    const user = prosc.authenticate(req);
    if (!user || user.role !== "admin") return res.status(403).json({ status: "error", message: "Unauthorized" });
    res.json(prosc.getDashboard());
});

app.listen(PORT, () => console.log(`🚀 Prosc Server running on port ${PORT}`));

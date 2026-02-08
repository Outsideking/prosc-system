const axios = require('axios');
const base64 = Buffer.from('admin:supersecret').toString('base64');

async function testDynamicAPI() {
    const response = await axios.post('http://localhost:3000/prosc/registerSchema', {
        route: "testAPI",
        processLogic: async (input) => ({ message: `Hello ${input.name}` })
    }, { headers: { owner: "admin" } });
    console.log(response.data);

    const apiResponse = await axios.post('http://localhost:3000/dynamic/testAPI/v1', { name: "Rufio" },
        { headers: { authorization: base64 } });
    console.log(apiResponse.data);
}

testDynamicAPI();
class Stephen {
    async getData() { return { stephenValue: "ข้อมูลจาก Stephen" }; }
    async receiveData(data) { console.log("✅ Stephen รับข้อมูล:", data); }
}
module.exports = Stephen;
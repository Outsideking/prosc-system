class SC {
    async getData() { return { scValue: "ข้อมูลจาก SC" }; }
    async receiveData(data) { console.log("✅ SC รับข้อมูล:", data); }
}
module.exports = SC;
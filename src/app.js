const express = require("express");
const bodyParser = require("body-parser");
const click = require("./presentation/http/click.controller");

const app = express();
app.use(bodyParser.json());

app.get("/click/pay", click.pay);
app.post("/click/webhook", click.webhook);

app.listen(3000, () => {
  console.log("🌐 HTTP server running");
});

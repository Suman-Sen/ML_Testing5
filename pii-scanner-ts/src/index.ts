import express from "express";
import bodyParser from "body-parser";
import apiRoutes from "./routes/api";

const app = express();
app.use(bodyParser.json());
app.use("/", apiRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

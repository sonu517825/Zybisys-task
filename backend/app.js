require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(logger("dev"));

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
  })
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

const Router = require("./routes/index");

app.use("/api", Router);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("App running on ", PORT)
})




import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: clientOrigin,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api",
  });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

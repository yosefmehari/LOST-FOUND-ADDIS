import express from "express";
import cors from "cors";
const app = express();
const PORT = Number(process.env.PORT) || 5000;
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Lost & Found Addis API is running",
    });
});
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});

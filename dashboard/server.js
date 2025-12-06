import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`App listening on port ${PORT}`);
});
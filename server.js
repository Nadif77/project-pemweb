require("dotenv").config(); // Load environment variables from .env file
const app = require("./app"); // Import the Express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

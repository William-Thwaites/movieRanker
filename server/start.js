const connectDB = require('./config/database');
const app = require('./index');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`🎬 Movie Ranker server running at http://localhost:${PORT}`);
});

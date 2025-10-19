const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors=require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to the Coding Judges Server!');
});
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


import express from 'express';
import cors from 'cors';

const app = express();
const hostname = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.static('./public'));

try {
  app.listen(PORT, hostname, () => {
    console.log(`Server listening on http://${hostname}:${PORT}`);
  });
} catch (error) {
  console.error('Error starting the server:', error);
}

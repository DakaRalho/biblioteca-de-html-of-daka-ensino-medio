const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



const db = require('./db');
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  });
});




const jwt = require('jsonwebtoken');

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token });
  });
});




const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/create-post', authenticateToken, (req, res) => {
  const { content } = req.body;

  db.run('INSERT INTO posts (userId, content) VALUES (?, ?)', [req.user.userId, content], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao criar postagem.' });
    }
    res.status(201).json({ message: 'Postagem criada com sucesso.' });
  });
});

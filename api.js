const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const client = require('./connection.js');
const express = require('express');
const jwt = require('jsonwebtoken'); // Import JWT library
const app = express();

app.listen(3300, () => {
  console.log("Server is now listening at port 3300");
});

client.connect();
app.use(bodyParser.json());
const secretKey = 'yourSecretKey';
const users = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' },
];

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
}
app.post('/login', (req, res) => {
  const { username, password } = req.body;
const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
  const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' });

  res.json({ token });
});
app.get('/users', (req, res) => {
  client.query(`SELECT * FROM users`, (err, result) => {
    if (!err) {
      res.send(result.rows);
    }
  });
  client.end;
});
app.get('/users/:id', authenticate, (req, res) => {
  const userId = req.params.id;

  const query = 'SELECT * FROM users WHERE user_id = $1';

  client.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.send(result.rows);
    }
  });
});

app.post('/users', authenticate, (req, res) => {
  const { user_name, user_email, user_password, user_image, total_orders } = req.body;
  const user_id = uuidv4(); // Generate a new UUID for the user
  const query = `
    INSERT INTO users (user_id, user_name, user_email, user_password, user_image, total_orders, created_at, last_logged_in)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  const values = [user_id, user_name, user_email, user_password, user_image, total_orders];

  client.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'User inserted successfully' });
    }
  });
});

app.get('/details/:id', (req, res) => {
  const userId = req.params.id;

  
  const query = 'SELECT * FROM users WHERE user_id = $1';

  client.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user details:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.send(result.rows[0]);
      }
    }
  });
});
app.put('/update/:id', authenticate, (req, res) => {
    const userId = req.params.id;
    const { user_name, user_email, user_password, user_image, total_orders } = req.body;
  
    // Your PostgreSQL query to update user information
    const query = `
      UPDATE users 
      SET 
        user_name = $2,
        user_email = $3,
        user_password = $4,
        user_image = $5,
        total_orders = $6,
        last_logged_in = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
  
    const values = [userId, user_name, user_email, user_password, user_image, total_orders];
  
    client.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (result.rowCount === 0) {
          res.status(404).json({ error: 'User not found' });
        } else {
          res.json({ message: 'User updated successfully' });
        }
      }
    });
  });
  
  // Route to get the image of a specific user by user_id
app.get('/image/:user_id', (req, res) => {
    const userId = req.params.user_id;
  
    // Your PostgreSQL query to fetch the user's image based on user_id
    const query = 'SELECT user_image FROM users WHERE user_id = $1';
  
    client.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching user image:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'User not found' });
        } else {
          // Return the user's image data
          res.json({ user_image: result.rows[0].user_image });
        }
      }
    });
  });

  // Route to insert a new user into the database
app.post('/insert', authenticate, (req, res) => {
    const { user_name, user_email, user_password, user_image, total_orders } = req.body;
    const user_id = uuidv4(); // Generate a new UUID for the user
  
    // Your PostgreSQL query to insert a new user
    const query = `
      INSERT INTO users (user_id, user_name, user_email, user_password, user_image, total_orders, created_at, last_logged_in)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  
    const values = [user_id, user_name, user_email, user_password, user_image, total_orders];
  
    client.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(201).json({ message: 'User inserted successfully' });
      }
    });
  });
  
  // Route to delete a user from the database by user_id
app.delete('/delete/:user_id', authenticate, (req, res) => {
    const userId = req.params.user_id;
  
    // Your PostgreSQL query to delete a user by user_id
    const query = 'DELETE FROM users WHERE user_id = $1';
  
    client.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (result.rowCount === 0) {
          res.status(404).json({ error: 'User not found' });
        } else {
          res.json({ message: 'User deleted successfully' });
        }
      }
    });
  });
  














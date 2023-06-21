const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//for host
const path = require('path');
app.use(express.static(path.join(__dirname,'/build')));

// Connect to MongoDB
mongoose.connect('mongodb+srv://abhimanyur372:oiliDFeRwmA4FG0R@cluster0.yszwvoe.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  userName:String,
  dob:Date,
  place: String,
  age: Number,
  isBlocked : Boolean,
  email: String,
  education: String,
  phoneNumber: String,
  password: String,

});

const User = mongoose.model('User', userSchema);

const expenseSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.String,
    ref: 'User'
  },
  income: Number,
  expense: Number
});

const Expense = mongoose.model('Expense', expenseSchema);

const app = express();
app.use(express.json());

  // Define the POST route for user registration
app.post('/api/register', (req, res) => {
  console.log("inpost");
  const { name,userName,dob,place, age, email, education, phoneNumber, password } = req.body;
  User.findOne({ email: email })
    .then((existingUser) => {
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
      } 
      else 
      {
        const user = new User({
          _id: email,
          name,
          userName,
          dob,
          place,
          age,
          email,
          education,
          phoneNumber,
          password
        });
        user.save()
          .then(() => {
            res.status(200).json({ message: 'User registered successfully' });
          })
          .catch((error) => {
            console.error('Error registering user:', error);
            res.status(500).json({ message: 'Internal server error' });
          });
      }
    })
    .catch((error) => {
      console.error('Error checking existing user:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
});



//User login
app.post('/api/login', (req, res) => {
  console.log("login")
  const { email, password } = req.body;
  console.log(email, password)
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }


      console.log("pwddetails", password, user.password)
      if (password === user.password) {
        console.log("PASSWORD MATCHED")
        const token = jwt.sign({ username: user.email }, 'your-secret-key');
        console.log("token", token)

        res.json({ token, isBlocked : user.isBlocked });
        } 
        else {
        res.status(401).json({ message: 'Invalid password' });
      }
    })
    .catch((error) => {
      console.error('Error finding user:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
});

//Expenses
app.post('/api/expenses', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, 'your-secret-key', (err, decodedToken) => {
      if (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid token' });
      }

      const { username } = decodedToken;
      User.findOne({ email: username })
        .then((user) => {
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          console.log("POST EXP REQ:", req)
          console.log("INC", req.body.income)
          console.log("EXP", req.body.expense)
          const expense = new Expense({
            username: user._id, 
            income: req.body.income,
            expense: req.body.expense
          });
          expense.save()
            .then(() => {
              console.log('Expense added:', expense);
              res.status(201).json({ success: true, expense });
            })
            .catch((error) => {
              console.error('Error adding expense:', error);
              res.status(500).json({ success: false, error: 'Error adding expense' });
            });
        })
        .catch((error) => {
          console.error('Error finding user:', error);
          res.status(500).json({ message: 'Internal server error' });
        });
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, error: 'Error adding expense' });
  }
});


app.get('/api/user', (req, res) => {
  console.log("IN GET USER")
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, 'your-secret-key', (err, decodedToken) => {
    if (err) {
      console.error('Error verifying token:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { username } = decodedToken;
    res.json({ username });
  });
});

// Retrieve all expense
app.get('/api/expenses', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, 'your-secret-key', async (err, decodedToken) => {
      if (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid token' });
      }
      const { username } = decodedToken;
      const filter = username === "admin" ? undefined  : {username };
      const expenses = await Expense.find(filter);
      res.json(expenses);
    });
  } 
  catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ success: false, error: 'Error retrieving expenses' });
  }
});

// Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    await Expense.findByIdAndRemove(expenseId);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, error: 'Error deleting expense' });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  console.log("PUT EXPENSE")
  try {
    const expenseId = req.params.id;
    const updatedExpenseData = req.body;
    const updatedExpense = await Expense.findByIdAndUpdate(expenseId, updatedExpenseData, { new: true });
    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// all users
app.get('/api/users', async (req, res) => {
  try {
    const userList = await User.find();
    res.json(userList);
  } catch (error) {
    console.error('Error getting users list :', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// one user
app.get('/api/user/:id', async (req, res) => {

  try {
    const userId = req.params.id;

    const userInfo = await User.findById(userId);

    res.json(userInfo);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// update user
app.put('/api/user/:id', async (req, res) => {

  try {
    const userId = req.params.id;
    const updatedUser = req.body;
    const query = { _id: userId };
    const result = await User.replaceOne(query, updatedUser);

    res.json(result);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// block user
app.put('/api/user/:id/block', async (req, res) => {
  try {
    const userId = req.params.id;
    const filter = { _id: userId };

    const updateDef = {
      $set: {
        isBlocked: true
      },
    };
    const resp = await User.updateOne(filter, updateDef)
    res.json(resp);
  } catch (error) {
    console.error('Error while blocing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/user/:id/unblock', async (req, res) => {
  try {
    const userId = req.params.id;
    const filter = { _id: userId };

    const updateDef = {
      $set: {
        isBlocked: false
      },
    };
    const resp = await User.updateOne(filter, updateDef)
    res.json(resp);
  } catch (error) {
    console.error('Error while unblocing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// delete user
app.delete('/api/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const resp = await User.findByIdAndDelete(userId)
    res.json(resp);
  } catch (error) {
    console.error('Error while deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//host
app.get('/*', function(req, res) 
  {res.sendFile(path.join(__dirname,'/build/index.html')); });
// Start the server
const port = 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


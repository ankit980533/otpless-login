


const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
require('dotenv').config();
// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Sample user data
const users = [
    { id: 1, email: 'ankitraj980533@gmail.com', verified: false },
    { id: 2, email: 'tenj7981@gmail.com', verified: false }
];

const secretKey = 'secret';

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'temjing3@gmail.com',
        pass: process.env.PASS
    }
});



// Endpoint to request a magic link
app.post('/login/magic-link', (req, res) => {
    const { email } = req.body;
    

    // Check if the email exists
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a token
    const token = jwt.sign({ email }, secretKey, { expiresIn: '2h' });

    // Send the magic link to the user's email
    const magicLink = `http://localhost:3000/login?token=${token}`;
    const mailOptions = {
        from: 'temjing3@gmail.com',
        to: email,
        subject: 'Magic Link for Login',
        html: `Click <a href="${magicLink}">here</a> to login.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
            return res.status(500).json({ message: 'Error sending email.' });
        } else {
            console.log('Email sent:', info.response);
            res.send(`Magic link sent to ${email}.`);
        }
    });
});

// Endpoint to handle login
app.get('/login', (req, res) => {
    const token = req.query.token;
   

    // Verify the token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Invalid or expired token.' });
        } else {
            console.log(decoded);
            const userEmail = decoded.email;
          
            const user = users.find(user => user.email === userEmail);
            if (!user) {
                console.log("user not found")
                return res.status(404).json({ message: 'User not found.' });
            }

            // Update user's verification status
            user.verified = true;
            console.log("Sending test message through socket...");
            // io.emit('verificationSuccess', { userEmail, token });
            io.to(userEmail).emit('verificationSuccess', { userEmail, token });


            res.send('Login successful!');
        }
    });
});

// Socket.IO event handling
io.on('connection', socket => {
    console.log('A client connected');

    // Handle event to store user's socket ID
    socket.on('storeUserSocket', email => {
        console.log(`Storing socket ID for ${email}`);
        socket.join(email);
        // Store user's socket ID or perform any necessary operations
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

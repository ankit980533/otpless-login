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

const users = [
    { id: 1, email: 'ankitraj980533@gmail.com', verified: false },
    { id: 2, email: 'tenj7981@gmail.com', verified: false }
];

const secretKey = 'secret';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'temjing3@gmail.com',
        pass: process.env.PASS
    }
});



app.post('/login/magic-link', (req, res) => {
    const { email } = req.body;
    

    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const token = jwt.sign({ email }, secretKey, { expiresIn: '2h' });

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

app.get('/login', (req, res) => {
    const token = req.query.token;
   

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

            user.verified = true;
            console.log("Sending test message through socket...");

            io.to(userEmail).emit('verificationSuccess', { userEmail, token });


            res.send('Login successful!');
        }
    });
});

io.on('connection', socket => {
    console.log('A client connected');

    socket.on('storeUserSocket', email => {
        console.log(`Storing socket ID for ${email}`);
        socket.join(email);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const schoolModel = require('../models/schoolModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const sendEmail = require("../utils/mail");
const { generateWelcomeEmail } = require('../utils/emailtemplates');

const signUpUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, studentClass } = req.body;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate inputs
        if (!name || name.trim().length === 0) {
            return res.status(404).json({ message: "Name field cannot be empty" });
        }
        if (!email || !emailPattern.test(email)) { 
            return res.status(404).json({ message: "Invalid email" });
        }
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return res.status(404).json({ message: "Phone number field cannot be empty" });
        }
        if (!studentClass || studentClass.trim().length === 0) {
            return res.status(404).json({ message: "Student class field cannot be empty" });
        }

        // const existingEmail = await schoolModel.findOne({ email });
        // if (existingEmail) {
        //     return res.status(400).json({ message: 'User with this email already exists' });
        // }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hashSync(password, salt);

        // Create user
        const user = new schoolModel({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            studentClass,
            isVerified: false // User is not verified initially
        });

        const createdUser = await user.save();

        // Generate verification token
        const token = jwt.sign({ email: createdUser.email, userId: createdUser._id }, process.env.secret_key, { expiresIn: "1d" });

        // Send verification email
        const verificationLink = `${process.env.BASE_URL}/verify/${token}`;
        const emailSubject = 'Verification Mail';
        const html = generateWelcomeEmail(name, verificationLink);

        const mailOptions = {
            from: process.env.user,
            to: email,
            subject: emailSubject,
            html: html
        };

        await sendEmail(mailOptions);

        return res.status(200).json({ message: "Successful, please check your email to verify your account",token });
    } catch (error) {
        return res.status(500).json(error.message);
    }
};
const verifyUser = async (req, res) => {
    try {
        const { token } = req.params;
        const { email } = jwt.verify(token, process.env.secret_key);

        const user = await schoolModel.findOne({ email });
        if (!user) {
            console.log('User not found during verification.');
            return res.status(404).json({ message: "User not found" });
        }
        if (user.isVerified) {
            console.log('User already verified.');
            return res.status(400).json({ message: 'User already verified' });
        }

        user.isVerified = true;
        await user.save();

        console.log(`User ${email} verified successfully. Redirecting to login page...`);
        // Redirect to login page after verification
        return res.redirect(`${process.env.BASE_URL}/login`);
    } catch (error) {
        console.error('Error during verification:', error);
        return res.status(500).json(error.message);
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await schoolModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email is not registered' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        // Generate new verification token
        const token = jwt.sign({ email: user.email, userId: user._id }, process.env.secret_key, { expiresIn: "1d" });

        // Send verification email
        const verificationLink = `${process.env.BASE_URL}/verify/${token}`;
        const emailSubject = 'Resend Verification Mail';
        const html = generateWelcomeEmail(user.name, verificationLink);

        const mailOptions = {
            from: process.env.user,
            to: email,
            subject: emailSubject,
            html: html
        };

        await sendEmail(mailOptions);

        return res.status(200).json({ message: 'Verification email resent successfully' });
    } catch (error) {
        return res.status(500).json(error.message);
    }
};


// const login = async (req, res)=>{
//     try {
//         const {email, password}= req.body
//         const findUser = await schoolModel.findOne({email})
//         if(!findUser){
//             return res.status(404).json({message:'user with this email does not exist'})
//         }
//         const matchedPassword = await bcrypt.compare(password, findUser.password)
//        if(!matchedPassword){
//             return res.status(400).json({message:'invalid password'})
//         }
//         if(findUser.isVerified === false){
//            return  res.status(400).json({message:'user with this email is not verified'})
//         }
//         findUser.isLoggedIn = true
//         const token = jwt.sign({ 
//             name:findUser.name,
//             email: findUser.email,
//             userId: findUser._id }, 
//             process.env.secret_key,
//             { expiresIn: "1d" });

//             return  res.status(200).json({message:'login successfully ',token})

        
//     } catch (error) {
        
//         return res.status(500).json(error.message);
//     }
// }

const login = async (req, res) => {
    try {
        const { emailOrPhoneNumber, password } = req.body;

        const findUser = await schoolModel.findOne({ $or: [{ phoneNumber: emailOrPhoneNumber }, { email: emailOrPhoneNumber }] });
        if (!findUser) {
            return res.status(404).json({ message: 'User with this email or phone number does not exist' });
        }
        const matchedPassword = await bcrypt.compare(password, findUser.password);
        if (!matchedPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        if (!findUser.isVerified) {
            return res.status(400).json({ message: 'User with this email is not verified' });
        }
        findUser.isLoggedIn = true;
        const token = jwt.sign({ name: findUser.name, email: findUser.email, userId: findUser._id }, process.env.secret_key, { expiresIn: "1d" });

        return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        return res.status(500).json(error.message);
    }
};

module.exports = {
    signUpUser,
    verifyUser,
    resendVerification,
    login,
};

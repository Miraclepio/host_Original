const schoolModel = require('../models/schoolModel')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcryptjs')
require('dotenv').config()
const sendEmail = require("../utils/mail")
const {generateWelcomeEmail} = require('../utils/emailtemplates')
const signUpUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, studentClass } = req.body;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        //validating our inputs

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

        const existingEmail = await schoolModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
// using bcrypt to salt and hash our 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hashSync(password, salt);
       
        const user = new schoolModel({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            studentClass
        });

        const createdUser = await user.save();

       //using jwt to sign in our user in

        const token = jwt.sign({ email: createdUser.email, userId: createdUser._id }, process.env.secret_key, { expiresIn: "1d" });

        // Send verification mail
        const verificationLink = 'https://www.google.com/search?q=google%2Ccom&oq=google%2Ccom&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIPCAEQABgKGIMBGLEDGIAEMgwIAhAAGAoYsQMYgAQyBwgDEAAYgAQyCQgEEAAYChiABDIJCAUQABgKGIAEMgcIBhAAGIAEMgYIBxBFGDzSAQgzMTkwajBqN6gCCLACAQ&sourceid=chrome&ie=UTF-8';
        const emailSubject = 'Verification Mail';
        const html = generateWelcomeEmail(name, verificationLink);
        // using nodemailer to send mail to our user
        const mailOptions = {
            from: process.env.user,
            to: email, // Use the user's email address here
            subject: emailSubject,
            html: html
        };

       

        await sendEmail(mailOptions);

        return res.status(200).json({ message: "Successful", token });
    } catch (error) {
        
        return res.status(500).json(error.message);
    }
};

const verifyUser = async (req,res)=>{
    try {
const {token} = req.params
 const {email} = jwt.verify(token, process.env.secret_key)

 const user = await schoolModel.findOne({email})
 if(!user){
    return res.status(404).json({message:"user not found"})
 }
 if(user.isVerified = true){
    return res.status(400).json({message:'user already verified'})
 }


 user.isVerified =true

 await user.save()
 res.status(200).json({message:"verified success", user})
        
    } catch (error) {
        
        return res.status(500).json(error.message);
    }
}

const resendVerification = async(req, res)=>{
   try {
    const {email} = req.body
    const checkUser = await schoolModel.findOne({email})
    if(!checkUser){
        return res.status(400).json({message:'user with this email is not registered'})
    }

    const verificationLink = 'https://www.google.com/search?q=google%2Ccom&oq=google%2Ccom&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIPCAEQABgKGIMBGLEDGIAEMgwIAhAAGAoYsQMYgAQyBwgDEAAYgAQyCQgEEAAYChiABDIJCAUQABgKGIAEMgcIBhAAGIAEMgYIBxBFGDzSAQgzMTkwajBqN6gCCLACAQ&sourceid=chrome&ie=UTF-8';
    const emailSubject = ' Resend Verification Mail';
    const html = generateWelcomeEmail();
    const mailOptions = {
        from: process.env.user,
        to: email, 
        subject: emailSubject,
        html: html
    };



   

    await sendEmail(mailOptions);
 return  res.status(200).json({message:'mail resent successfully'})
    
   } catch (error) {
        
    return res.status(500).json(error.message);
}
}


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


const login = async (req, res)=>{
    try {
        const {emailOrPaaword, password}= req.body
        
        const findUser = await schoolModel.findOne({$or:[{name:emailOrPaaword},{email:emailOrPaaword}]})
        if(!findUser){
            return res.status(404).json({message:'user with this email does not exist'})
        }
        const matchedPassword = await bcrypt.compare(password, findUser.password)
       if(!matchedPassword){
            return res.status(400).json({message:'invalid password'})
        }
        if(findUser.isVerified === false){
           return  res.status(400).json({message:'user with this email is not verified'})
        }
        findUser.isLoggedIn = true
        const token = jwt.sign({ 
            name:findUser.name,
            email: findUser.email,
            userId: findUser._id }, 
            process.env.secret_key,
            { expiresIn: "1d" });

            return  res.status(200).json({message:'login successfully ',token})

        
    } catch (error) {
        
        return res.status(500).json(error.message);
    }
}

module.exports={
    signUpUser,
    verifyUser,
    resendVerification,
login,


}


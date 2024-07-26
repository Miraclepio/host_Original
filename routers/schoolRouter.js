const express = require('express')
const router = express.Router()
    const {signUpUser,verifyUser, resendVerification,login} = require('../controllers/schoolController')
 const {changePassword,forgotPassword,resetPassword} = require('../controllers/password')
router.route("/registerUser").post(signUpUser)
router.route("/verifyUser/:token").post(verifyUser)
router.route("/resendVerification").post(resendVerification)
router.route("/login").post(login)
router.route("/resetPassword/:token").post(resetPassword)
router.route("/forgotPassword").post(forgotPassword)

module.exports = router
const userSchema = require('../model/user.model');
const awsService = require('../service/aws.service');
const jwtService = require('../service/jwt.service');
const bcrypt = require('bcrypt');
const isEmail = require('isemail');

const isValid = value => {
    if (typeof value === "undefined" || typeof value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    if (typeof (value) == "number" && value === null) return false
    return true
}
const isValidRequestBody = body => {
    if (Object.keys(body).length > 0) return true
    else return false
}
const register = async (req, res) => {
    try {
        const data = req.body
        const file = req.files;
        if (!(isValidRequestBody(data))) {
            return res.status(400).send({
                status: false,
                message: "Body should not be an empty"
            });
        }
        const requiredFields = ['fname', 'lname', 'email', 'phone', 'password','profileImage'];
        for (let i = 0; i <= requiredFields.length - 1; i++) {
            if (!isValid(data[requiredFields[i]])) {
                return res.status(400).send({
                    status: false,
                    message: `${requiredFields[i]} field is required`
                });
            }
        }
        const regexPhone = /^[6789]\d{9}$/;
        if (!regexPhone.test(data.phone)) {
            return res.status(400).send({
                status: false,
                message: 'The mobile number must be 10 digits and should be only Indian number'
            });
        }
        const isPhone = await userSchema.findOne({ phone: data.phone })
        if (isPhone) {
            return res.status(400).send({
                status: false,
                message: 'Phone Number is already exist'
            })
        }
        const checkEmail = await userSchema.findOne({ email: data.email });
        if (checkEmail) {
            return res.status(400).send({
                status: false,
                message: 'Email is already exist'
            });
        }
        if (!(data.password.length >= 8 && data.password.length <= 15)) {
            return res.status(400).send({
                status: false,
                message: 'Minimum password should be 8 and maximum will be 15'
            });
        }
        data.password = await bcrypt.hash(data.password, 10);


        if (!isValidRequestBody(data.address))
            return res.status(400).json({ status: false, msg: "address is required" });

        if (!isValidRequestBody(data.address.shipping && data.address.billing))
            return res.status(400).json({ status: false, msg: "please provide address details" });


        if (!isValid(data.address.shipping.street))
            return res.status(400).json({ status: false, msg: "please provide shipping street details" });

        if (!isValid(data.address.shipping.city))
            return res.status(400).json({ status: false, msg: "please provide shipping city details" });

        if (!isValid(data.address.shipping.pincode))
            return res.status(400).json({ status: false, msg: "please provide shipping pincode details" });

        if (isNaN(data.address.shipping.pincode))
            return res.status(400).json({ status: false, msg: "shipping pincode should be Number" })

        if (!isValid(data.address.billing.street))
            return res.status(400).json({ status: false, msg: "please provide address billing street details" });

        if (!isValid(data.address.billing.city))
            return res.status(400).json({ status: false, msg: "please provide address billing city details" });

        if (!isValid(data.address.billing.pincode))
            return res.status(400).json({ status: false, msg: "please provide address billing pincode details" });

        if (isNaN(data.address.billing.pincode))
            return res.status(400).json({ status: false, msg: " billing pincode should be Number" })

        const regexPin = /(^[0-9]{6}(?:\s*,\s*[0-9]{6})*$)/;
        if (!regexPin.test(data.address.shipping.pincode) || !regexPin.test(data.address.shipping.pincode)) {
            return res.status(400).send({
                status: false,
                message: `Enter the valid Pincode`
            });
        }

        //     }
        // if (file && file.length > 0) {
        //     if (file[0].mimetype.indexOf('image') == -1) {
        //         return res.status(400).send({
        //             status: false,
        //             message: 'Only image files are allowed !'
        //         });
        //     }
        //     console.log(file[0])
        //     const profile_url = await awsService.uploadFile(file[0]);
        // data.profileImage = profile_url;
        // console.log(profile_url)

        // return res.status(400).send({
        //     status: false,
        //     message: `profileImage field is required`
        // });
        const dataRes = await userSchema.create(data);
        return res.status(201).send({
            status: true,
            message: "User created successfully",
            data: dataRes
        });

    }
    catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }

}



const login = async (req, res) => {
    try {
        const data = req.body;
        const { email, password } = data;

        if (Object.keys(data).length == 0) {
            return res.status(400).send({
                status: false,
                message: 'Email and Password field is required '
            });
        }

        if (!email.trim() || email.trim() == '') {
            return res.status(400).send({
                status: false,
                message: 'Email field is required '
            });
        }

        if (!password.trim() || password.trim() == '') {
            return res.status(400).send({
                status: false,
                message: 'Password field is required '
            });
        }

        if (!isEmail.validate(email)) {
            return res.status(400).send({
                status: false,
                message: 'Enter a valid Email Id'
            });
        }

        const userRes = await userSchema.findOne({
            email: email
        });
        if (!userRes) {
            return res.status(401).send({
                status: false,
                message: 'Invalid email Id'
            });
        }

    const result = bcrypt.compare(password, userRes.password)
            if (!result) {
                return res.status(401).send({
                    status: false,
                    message: 'Invalid PassworD'
                });
            }

            const token = jwtService.createToken(userRes._id);
            if (token != undefined) {
                return res.status(200).send({
                    status: true,
                    message: "User login success !",
                    data: {
                        userId: userRes._id,
                        token: token
                    }
                });
            }
        }
     catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userRes = await userSchema.findById(userId);
        if (!userRes) {
            return res.status(404).send({
                status: false,
                message: 'User not found'
            });
        }

        return res.status(200).send({
            status: true,
            message: 'User profile details',
            data: userRes
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const keys = Object.keys(data);
        const file = req.files;
        if (keys.length == 0) {
            return res.status(200).send({
                status: false,
                message: "No any changes"
            });
        }
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == '_id') {
                return res.status(400).send({
                    status: false,
                    message: 'You are not able to update _id property'
                });
            }
            else {   
                if (keys[i] == 'email') {
                    if (!isEmail.validate(data.email)) {
                        return res.status(400).send({
                            status: false,
                            message: 'Enter a valid Email Id'
                        });
                    }
                }
                else if (keys[i] == 'phone') {
                    const regex = /^[6789]\d{9}$/;
                    if (!regex.test(data.phone)) {
                        return res.status(400).send({
                            status: false,
                            message: 'The mobile number must be 10 digits and should be only Indian number'
                        });
                    }
                }
                else if (keys[i] == 'address.shipping.pincode' || keys[i] == 'address.billing.pincode') {
                    const regex = /^\d{6}$/;
                    if (!regex.test(data[keys[i]])) {
                        return res.status(400).send({
                            status: false,
                            message: `Enter the valid Pincode of ${keys[i]}`
                        });
                    }
                }
                else if (keys[i] == 'password') {
                    if (!(data.password.length >= 8 && data.password.length <= 15)) {
                        return res.status(400).send({
                            status: false,
                            message: 'Minimum password should be 8 and maximum will be 15'
                        });
                    }
                    data.password = bcrypt.hashSync(data.password, 10);
                }
            }
        }
        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({
                    status: false,
                    message: 'Only image files are allowed !'
                });
            }
            const profile_url = await awsService.uploadFile(file[0]);
            data.profileImage = profile_url;
        }
        console.log(data)
        const updateRes = await userSchema.findByIdAndUpdate(userId, data, {
            new: true
        });
        return res.status(200).send({
            status: true,
            message: `${Object.keys(data).length} field has been updated successfully !`,
            data: updateRes
        });
    } catch (error) {
        if (error.code == 11000) {
            const key = Object.keys(error['keyValue']);
            return res.status(400).send({
                status: false,
                message: `[${error['keyValue'][key]}] ${key} is already exist ! `
            });
        }
        if (error.name == 'CastError') {
            return res.status(400).send({
                status: false,
                message: error.message
            });
        }
        return res.status(500).send({
            status: false,
            message: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getUserProfile,
    updateUserProfile
}
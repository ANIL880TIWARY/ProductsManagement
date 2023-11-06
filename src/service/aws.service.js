const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID,
    region: process.env.AWS_REGION
});

const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
        const S3 = new AWS.S3({
            apiVersion: '2006-03-01'
        });

        const uploadParams = {
            ACL: "public-read",
            Bucket: "functionup-93",
            Key: "userPorfile/" + file.originalname,
            Body: file.buffer
        }

        S3.upload(uploadParams, (error, data) => {
            if (error) {
                console.log(error)
                console.log("anil")

                return reject(error);
            }
console.log(`uploaded >> ${data}`)
            return resolve(data.Location)
        });
    });
}

module.exports = {
    uploadFile
}
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Uploading a Bug Image
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const fileType = file.mimetype.split("/")[1];
    const filename = uuidv4() + "." + fileType;
    cb(null, filename);
  },
});

const BugUpload = multer({ storage }).single("bugImage");

module.exports.BugImageUpload = BugUpload;

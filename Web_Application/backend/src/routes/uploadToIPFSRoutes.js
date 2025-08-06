const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pinataSDK = require("@pinata/sdk");

const router = express.Router();

const pinata = new pinataSDK("9295ed624ad0803afc3d", "0cf8b2ac3e476724967ef5fe17d66deb7a4d1630156d0545c2296f426f2dc795");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageStream = fs.createReadStream(imagePath);

    const options = {
      pinataMetadata: {
        name: path.basename(imagePath),
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    const result = await pinata.pinFileToIPFS(imageStream, options);

    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      cid: result.IpfsHash,
      url: `https://ipfs.io/ipfs/${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    res.status(500).json({ success: false, message: "Upload failed", error });
  }
});

module.exports = router;
